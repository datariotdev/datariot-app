const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

const source = fs.readFileSync(path.join(__dirname, '../src/lib/supabase/searchUsers.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const compiled = { exports: {} };
new Function('module', 'exports', outputText)(compiled, compiled.exports);
const { normalizeUsernameQuery, searchUsers } = compiled.exports;

function clientWithFetch(fetch) {
    return createClient('https://example.supabase.co', 'public-test-key', {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch },
    });
}

const profile = (id, username) => ({ id, username, display_name: null, nickname: null, avatar_url: null });

test('normalizes @, whitespace and empty input without making a request', async () => {
    const client = clientWithFetch(() => assert.fail('empty queries must not reach the API'));
    assert.equal(normalizeUsernameQuery('  @Alice  '), 'Alice');
    for (const query of ['', '   ', '@', ' @@ ']) assert.deepEqual(await searchUsers(client, query), []);
});

test('real Supabase client sends bounded, ordered, public-field queries and excludes the viewer', async () => {
    const requests = [];
    const client = clientWithFetch(async url => {
        requests.push(new URL(url));
        return new Response('[]', { status: 200 });
    });
    await searchUsers(client, ' @Alice ', 'viewer-id');
    assert.equal(requests.length, 2);
    assert.deepEqual(requests.map(url => url.searchParams.get('username')).sort(), ['imatch.Alice', 'imatch.^Alice$'].sort());
    for (const url of requests) {
        assert.equal(url.pathname, '/rest/v1/profiles');
        assert.equal(url.searchParams.get('select'), 'id,username,display_name,nickname,avatar_url');
        assert.equal(url.searchParams.get('id'), 'neq.viewer-id');
        assert.equal(url.searchParams.get('order'), 'username.asc,id.asc');
        assert.equal(url.searchParams.get('limit'), '20');
    }
});

test('case-insensitive exact and partial matches put exact first, deduplicate and cap at 20', async () => {
    const exact = profile('exact', 'ALICE');
    const partial = Array.from({ length: 20 }, (_, i) => profile(`partial-${i}`, `a${i}alice`));
    const client = clientWithFetch(async url => new Response(JSON.stringify(
        new URL(url).searchParams.get('username').startsWith('imatch.^') ? [exact] : [...partial, exact],
    )));
    const result = await searchUsers(client, 'alice');
    assert.equal(result[0].id, 'exact');
    assert.equal(result.length, 20);
    assert.equal(new Set(result.map(row => row.id)).size, 20);
});

test('single characters, underscores, wildcards and regex punctuation stay literal', async () => {
    for (const query of ['a', 'jane_doe', '100%', '*', 'a.b', 'a\\b', '[x](y)+?^${}|']) {
        const requests = [];
        const client = clientWithFetch(async url => {
            requests.push(new URL(url).searchParams.get('username').slice('imatch.'.length));
            return new Response('[]');
        });
        await searchUsers(client, query);
        const exact = new RegExp(requests.find(value => value.startsWith('^')), 'i');
        assert.ok(exact.test(query));
        assert.ok(!exact.test(`extra${query}extra`));
        if (query === '*') assert.ok(!exact.test('unrelated'));
        if (query === 'jane_doe') assert.ok(!exact.test('janeXdoe'));
        if (query === '100%') assert.ok(!exact.test('100anything'));
    }
});

test('API errors propagate instead of looking like an empty successful search', async () => {
    const client = clientWithFetch(async () => new Response(JSON.stringify({ message: 'permission denied', code: '42501' }), { status: 403 }));
    await assert.rejects(searchUsers(client, 'alice'), error => error.code === '42501');
});

test('an aborted search passes its signal to both requests and rejects', async () => {
    const controller = new AbortController();
    const client = clientWithFetch(async (_url, options) => {
        assert.equal(options.signal, controller.signal);
        throw new DOMException('Aborted', 'AbortError');
    });
    controller.abort();
    await assert.rejects(searchUsers(client, 'alice', undefined, controller.signal));
});
