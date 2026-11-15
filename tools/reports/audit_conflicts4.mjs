import fs from 'node:fs';
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/', ad = 'source/assets/data/';
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const chuni = read(rd + 'chuni.json').songs;
const designers = read(rd + 'chuni_designers.json');
const c2s = read('_tmp/game/c2s-designers-all.json');
const extra = read(rd + 'chuni_extra.json');
const notes = read(rd + 'chuni_notes.json');
const previews = read(rd + 'chuni_previews.json');
const removed = read(rd + 'chuni_removed_songs.json');
const keys = ['B', 'A', 'E', 'M', 'U', 'W'];
const idx = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4, we: 5 };

// 站点谱面作者展示值（designers.json 由 chuni_designers 派生）
let cmp = 0, mism = 0; const ms = [];
for (const s of chuni) {
  const d = designers[s.title] || {};
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    const siteVal = String(d[keys[i]] || '').trim();
    const a = c2s[`${s.id}_${i}`];
    if (!a || !siteVal) continue;
    cmp++;
    if (norm(a) !== norm(siteVal)) { mism++; if (ms.length < 12) ms.push(`${s.title}/${sh.difficulty}: c2s=${a} | site=${siteVal}`); }
  }
}
console.log('c2s vs designers: compared', cmp, 'mismatch', mism);
for (const x of ms) console.log('  ', x);

// extra zh coverage
let missZh = 0, missJp = 0;
for (const [k, v] of Object.entries(extra)) {
  if (!v.wiki_comment_zh) missZh++;
  if (!v.wiki_comment) missJp++;
}
console.log('extra', Object.keys(extra).length, 'missing wiki_comment_zh', missZh, 'missing wiki_comment', missJp);

// notes coverage vs songs
let withNotes = 0;
for (const s of chuni) if (notes[s.title]) withNotes++;
console.log('songs with notes', withNotes, 'notes entries', Object.keys(notes).length);

// previews coverage
let missPrev = 0;
for (const s of chuni) for (const sh of s.sheets || []) { const i = idx[String(sh.difficulty).toLowerCase()]; if (i == null) continue; if (!previews[`${s.id}_${i}`]) missPrev++; }
console.log('missing previews', missPrev);

// A300 dirs
try {
  const dirs = fs.readdirSync('D:/SDHD - CHUNITHM Mate/HDD/bin/option/A300/music');
  console.log('A300 entries', dirs.length, dirs.slice(0, 3));
} catch (e) { console.log('A300 read fail', e.message); }

// removed coverage of designers/extra
let rExtra = 0, rBig = 0;
for (const r of removed) { if (extra[r.title]) rExtra++; if (designers[r.title]) rBig++; }
console.log('removed', removed.length, 'with extra', rExtra, 'with designers', rBig);
