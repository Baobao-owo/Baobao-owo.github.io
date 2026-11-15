import fs from 'node:fs';

const e = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));
const songs = Object.entries(e)
  .map(([t, x]) => {
    const b = (x.wiki_comment || '') + '\n' + (x.origins || []).join('\n');
    let s = (x.origins || []).length ? 3 : 0;
    s += (b.match(/[「『]/g) || []).length;
    s += /[A-Za-z]{4,}/.test(b) ? 1 : 0;
    return { t, s };
  })
  .filter((x) => x.s > 0);

const dir = '_tmp/neta-census';
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
const done = new Set(files.map((f) => f.replace(/\.json$/, '')));
const slug = (t) => String(t).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80);

let d = 0;
for (const x of songs) if (done.has(slug(x.t))) d++;

let withHits = 0;
let empty = 0;
for (const f of files) {
  try {
    const r = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
    const n = (r.results || []).reduce((a, x) => a + (x.hits ? x.hits.length : 0), 0);
    if (n > 0) withHits++;
    else empty++;
  } catch (e) {}
}
console.log('候选总数', songs.length, '| 已完成', d, '| 剩余', songs.length - d);
console.log('有摘要', withHits, '| 空', empty);
