import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const chuni = J('source/_data/chuni.json').songs;
const designers = J('source/_data/chuni_designers.json');
const c2s = J('_tmp/game/c2s-designers-all.json');
const ids = J('source/_data/chuni_ids.json');
const previews = J('source/_data/chuni_previews.json');
const alias = J('source/_data/chuni_designer_alias.json');
const keys = ['B', 'A', 'E', 'M', 'U', 'W'];
const idx = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4, we: 5 };

let cmp = 0, mism = 0, noC2s = 0; const ms = [];
for (const s of chuni) {
  const mid = ids[s.title] ?? ids[String(s.id)];
  if (mid == null) { noC2s++; continue; }
  const d = designers[s.title] || designers[String(s.id)] || {};
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    if (i == null) continue;
    const siteVal = String(d[keys[i]] || '').trim();
    const a = c2s[`${mid}_${i}`];
    if (!a || !siteVal) continue;
    cmp++;
    if (norm(a) !== norm(siteVal)) { mism++; if (ms.length < 12) ms.push(`${s.title}/${sh.difficulty}: c2s=${a} | site=${siteVal}`); }
  }
}
console.log('c2s vs designers: compared', cmp, 'mismatch', mism, 'songs without musicId', noC2s);
for (const x of ms) console.log('  ', x);

// previews coverage via musicId
let miss = 0, total = 0;
for (const s of chuni) {
  const mid = ids[s.title];
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    if (i == null) continue;
    total++;
    if (mid == null || !previews[`${mid}_${i}`]) miss++;
  }
}
console.log('previews total', total, 'missing', miss);

// alias × entries (合作写法) and how many are in designers
const memEntries = Object.entries(alias).filter(([, v]) => String(v).includes(' × '));
console.log('alias × entries', memEntries.length);
let mapped = 0; for (const [, v] of memEntries) if (Object.values(designers).some(x => Object.values(x).includes(v))) mapped++;
console.log('alias × values used as designer value', mapped);

// titles in removed but also in chuni
const removed = J('source/_data/chuni_removed_songs.json');
const live = new Set(chuni.map(s => s.title));
const both = removed.filter(r => live.has(r.title)).map(r => r.title);
console.log('removed also live', both.length, both.slice(0, 8).join(' | '));

// version labels raw
const vers = {}; for (const s of chuni) vers[s.version] = (vers[s.version] || 0) + 1;
console.log('versions', JSON.stringify(vers));
