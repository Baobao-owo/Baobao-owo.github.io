// 找出还没抓到页面的合作曲（对照 collab.json 与 _tmp/wiki/songpage 里已抓的页面）
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const squash = (s) => String(s || '').normalize('NFKC').replace(/[\s\u3000]+/g, '').toLowerCase();

const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const siteByNorm = new Map();
for (const s of site.songs) siteByNorm.set(norm(s.title), s.title);

const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
const wikiTitles = new Map();
for (const s of sections) {
  if (!/合作/.test(s.heading)) continue;
  for (const r of s.rows) if (!wikiTitles.has(norm(r.title))) wikiTitles.set(norm(r.title), r.title);
}

const have = new Set(
  fs
    .readdirSync('_tmp/wiki/songpage')
    .filter((f) => f.endsWith('.html'))
    .map((f) => squash(f.replace(/\.html$/, '')))
);

const misses = [];
for (const key of Object.keys(collab.songs)) {
  const siteTitle = siteByNorm.get(norm(key)) || key;
  const wikiTitle = wikiTitles.get(norm(key)) || siteTitle;
  if (have.has(squash(wikiTitle))) continue;
  misses.push(siteTitle);
}

fs.writeFileSync('_tmp/wiki/collab-misses.json', JSON.stringify(misses, null, 1), 'utf8');
console.log('未抓到页面的合作曲:', misses.length);
misses.slice(0, 25).forEach((m) => console.log('  ' + m));
