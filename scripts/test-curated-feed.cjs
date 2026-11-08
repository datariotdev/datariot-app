const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, '../src/lib/curated/reels.ts');
const { outputText } = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
});
const moduleResult = { exports: {} };
new Function('require', 'module', 'exports', outputText)(createRequire(sourcePath), moduleResult, moduleResult.exports);
const { BUNDLED_REELS, instagramCode, instagramEmbedUrl, mergeFeedEntries } = moduleResult.exports;

test('published selection contains the 58 shortlisted sources, no held/rejected sources', () => {
    const manifest = require('../datariot-seeder/instagram/candidates.json');
    const expected = manifest.items.filter(item => item.screening.decision === 'shortlist').map(item => item.source_url).sort();
    assert.equal(BUNDLED_REELS.length, 58);
    assert.deepEqual(BUNDLED_REELS.map(reel => reel.source_url).sort(), expected);
    assert.ok(BUNDLED_REELS.every(reel => reel.title && reel.creator && instagramCode(reel.source_url)));
});

test('new sources appear in the actual feed alongside native videos, without duplicates', () => {
    const native = [{ id: 'native-one' }, { id: 'native-two' }];
    const entries = mergeFeedEntries(native, BUNDLED_REELS);
    assert.equal(entries.length, 60);
    assert.equal(entries.filter(entry => entry.kind === 'instagram').length, 58);
    assert.equal(entries.filter(entry => entry.kind === 'native').length, 2);
    assert.equal(new Set(entries.map(entry => entry.key)).size, 60);
    assert.equal(entries[0].kind, 'instagram');
});

test('post and reel aliases share one card and preserve the observed player URL', () => {
    const first = BUNDLED_REELS[0];
    const alias = { ...first, source_url: first.source_url.replace('/reel/', '/p/') };
    assert.equal(mergeFeedEntries([], [first, alias]).length, 1);
    assert.equal(instagramEmbedUrl(alias.source_url), `${alias.source_url}embed/`);
});

test('foreign hosts and malformed paths cannot become player URLs', () => {
    for (const url of ['https://www.instagram.com.evil/reel/abc/', 'javascript:alert(1)', 'https://www.instagram.com/stories/abc/']) {
        assert.equal(instagramCode(url), null);
        assert.throws(() => instagramEmbedUrl(url));
    }
});
