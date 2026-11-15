const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

function loadTs(file) {
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const result = { exports: {} };
    new Function('require', 'module', 'exports', output)(name => name.startsWith('.')
        ? loadTs(path.resolve(path.dirname(file), `${name}.ts`)) : require(name), result, result.exports);
    return result.exports;
}
const service = loadTs(path.resolve(__dirname, '../src/lib/supabase/notifications.ts'));
const { NotificationsStore } = loadTs(path.resolve(__dirname, '../src/lib/notificationsStore.ts'));
const row = (id, changes = {}) => ({ id, user_id: 'alice', actor_id: 'bob', type: 'follow', title: 'started following you',
    body: null, video_id: null, post_id: null, comment_id: null, chat_id: null, created_at: '2026-11-15T10:00:00Z', is_read: false, ...changes });
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const api = overrides => ({ list: async () => [], count: async () => 0, read: async () => [], ...overrides });
const client = fetch => createClient('https://example.supabase.co', 'public-test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch } });

test('list request scopes recipient, filters unread, orders ties and pages with a cursor', async () => {
    let request;
    const db = client(async url => { request = new URL(url); return new Response('[]'); });
    await service.fetchNotifications(db, 'alice', true, row('cursor'));
    const p = request.searchParams;
    assert.equal(p.get('user_id'), 'eq.alice');
    assert.equal(p.get('is_read'), 'eq.false');
    assert.equal(p.get('limit'), '30');
    assert.equal(p.get('order'), 'created_at.desc,id.desc');
    assert.equal(p.get('or'), '(created_at.lt.2026-11-15T10:00:00Z,and(created_at.eq.2026-11-15T10:00:00Z,id.lt.cursor))');
});

test('actors are fetched once and missing/deleted profiles have a safe fallback', async () => {
    let profiles = 0;
    const db = client(async url => {
        if (new URL(url).pathname.endsWith('/profiles')) { profiles++; return new Response(JSON.stringify([{ id: 'bob', username: 'bob' }])); }
        return new Response(JSON.stringify([row('1'), row('2'), row('3', { actor_id: 'deleted' })]));
    });
    const rows = await service.fetchNotifications(db, 'alice');
    assert.equal(profiles, 1);
    assert.equal(rows[0].actor.username, 'bob');
    assert.equal(rows[2].actor, null);
});

test('mark-read only writes is_read and uses the recipient and snapshot boundary', async () => {
    let request;
    const db = client(async (url, options) => { request = { url: new URL(url), options }; return new Response('[{"id":"old"}]'); });
    assert.deepEqual(await service.markNotificationsRead(db, 'alice', { through: row('snapshot') }), ['old']);
    assert.equal(request.options.method, 'PATCH');
    assert.deepEqual(JSON.parse(request.options.body), { is_read: true });
    assert.equal(request.url.searchParams.get('user_id'), 'eq.alice');
    assert.match(request.url.searchParams.get('or'), /id.lte.snapshot/);
});

test('unread badge uses an exact HEAD count rather than the loaded page length', async () => {
    const db = client(async (url, options) => {
        assert.equal(options.method, 'HEAD');
        assert.equal(new URL(url).searchParams.get('is_read'), 'eq.false');
        return new Response(null, { headers: { 'content-range': '0-0/81' } });
    });
    assert.equal(await service.fetchUnreadCount(db, 'alice'), 81);
});

test('navigation opens profiles, exact videos, comments, posts and existing chats', () => {
    assert.deepEqual(service.notificationTarget(row('1')), { pathname: '/user/[id]', params: { id: 'bob' } });
    assert.deepEqual(service.notificationTarget(row('2', { type: 'message', chat_id: 'chat' })), { pathname: '/chat/[id]', params: { id: 'chat', name: 'Chat' } });
    assert.equal(service.notificationTarget(row('3', { type: 'comment', post_id: 'post' })).params.id, 'post');
    const video = service.notificationTarget(row('4', { type: 'reply', video_id: 'video', comment_id: 'comment' }));
    assert.equal(video.params.videoId, 'video');
    assert.equal(video.params.openComments, '1');
    assert.equal(service.notificationTarget(row('5', { actor_id: null })), null);
    assert.equal(service.notificationTarget(row('6', { type: 'post_like' })), null);
});

test('time labels handle recent, future and invalid dates', () => {
    const now = Date.parse('2026-11-15T10:05:00Z');
    assert.equal(service.notificationTime('2026-11-15T10:00:00Z', now), '5m');
    assert.equal(service.notificationTime('2026-11-16T00:00:00Z', now), 'Just now');
    assert.equal(service.notificationTime('invalid', now), '');
});

test('a previous account cannot repopulate the list or badge after sign-out', async () => {
    const pending = deferred();
    const store = new NotificationsStore(api({ list: () => pending.promise, count: async () => 10 }));
    store.setUser('alice');
    store.setUser(null);
    pending.resolve([row('1')]);
    await tick();
    assert.equal(store.getSnapshot().userId, null);
    assert.equal(store.getSnapshot().unreadCount, 0);
    assert.deepEqual(store.getSnapshot().items, []);
});

test('out-of-order refreshes keep only the latest response', async () => {
    const old = deferred(); const current = deferred(); let calls = 0;
    const store = new NotificationsStore(api({ list: () => (++calls === 1 ? old.promise : current.promise) }));
    store.setUser('alice');
    const refreshing = store.refresh();
    current.resolve([row('new')]); await refreshing;
    old.resolve([row('old')]); await tick();
    assert.deepEqual(store.getSnapshot().items.map(x => x.id), ['new']);
});

test('pagination deduplicates rows and does not replace newer data', async () => {
    const first = Array.from({ length: 30 }, (_, i) => row(String(i)));
    const store = new NotificationsStore(api({ list: async (_id, _unread, cursor) => cursor ? [first[29], row('older')] : first }));
    store.setUser('alice'); await tick();
    await store.loadMore();
    assert.equal(store.getSnapshot().items.length, 31);
    assert.equal(store.getSnapshot().hasMore, false);
});

test('read failures keep the unread badge and expose a retryable error', async () => {
    const store = new NotificationsStore(api({ list: async () => [row('1')], count: async () => 1, read: async () => { throw Error('offline'); } }));
    store.setUser('alice'); await tick();
    assert.equal(await store.markRead('1'), false);
    assert.equal(store.getSnapshot().items[0].is_read, false);
    assert.equal(store.getSnapshot().unreadCount, 1);
    assert.ok(store.getSnapshot().actionError);
});

test('mark-all uses the last displayed snapshot and leaves new arrivals unread', async () => {
    let read = false;
    const store = new NotificationsStore(api({
        list: async () => read ? [row('new'), row('old', { is_read: true })] : [row('old')],
        count: async () => 1,
        read: async (_userId, options) => { assert.equal(options.through.id, 'old'); read = true; return ['old']; },
    }));
    store.setUser('alice'); await tick();
    await store.markRead();
    assert.equal(store.getSnapshot().items[0].is_read, false);
    assert.equal(store.getSnapshot().items[1].is_read, true);
    assert.equal(store.getSnapshot().unreadCount, 1);
});

test('failed refreshes retain visible rows and a successful retry clears the error', async () => {
    let fail = false;
    const store = new NotificationsStore(api({ list: async () => { if (fail) throw Error('offline'); return [row('1')]; } }));
    store.setUser('alice'); await tick();
    fail = true; await store.refresh();
    assert.equal(store.getSnapshot().items.length, 1);
    assert.ok(store.getSnapshot().error);
    fail = false; await store.refresh();
    assert.equal(store.getSnapshot().error, null);
});

test('filter changes discard the old request and request unread rows from the server', async () => {
    const old = deferred();
    const store = new NotificationsStore(api({ list: async (_id, unread) => unread ? [row('unread')] : old.promise }));
    store.setUser('alice'); store.setFilter('unread'); await tick();
    old.resolve([row('read', { is_read: true })]); await tick();
    assert.deepEqual(store.getSnapshot().items.map(x => x.id), ['unread']);
});

test('reconnecting the same session after cleanup restarts its initial load', async () => {
    const old = deferred(); let calls = 0;
    const store = new NotificationsStore(api({ list: async () => ++calls === 1 ? old.promise : [row('current')] }));
    store.setUser('alice'); store.dispose(); store.setUser('alice'); await tick();
    old.resolve([row('old')]); await tick();
    assert.equal(calls, 2);
    assert.equal(store.getSnapshot().loading, false);
    assert.equal(store.getSnapshot().items[0].id, 'current');
});
