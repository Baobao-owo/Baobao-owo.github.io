import fs from 'node:fs';
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/', ad = 'source/assets/data/';
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const chuni = read(rd + 'chuni.json').songs;
const removed = read(rd + 'chuni_removed_songs.json');
const designers = read(rd + 'chuni_designers.json');
const collab = read(ad + 'collab.json');
const dl = read(ad + 'designers.json');
const extra = read(rd + 'chuni_extra.json');
const ids = read(rd + 'chuni_ids.json');
const c2s = read('_tmp/game/c2s-designers-all.json');
const lxns = read('_tmp/lxns-songs.json').songs;
const cdata = read('_tmp/chunithm-data.json').songs;
const docx = read(rd + 'collab_docx_titles.json');
const fill = read(rd + 'chuni_designer_fill.json');

console.log('chuni songs', chuni.length, 'removed', removed.length, 'sum', chuni.length + removed.length);
console.log('designers.json stats', JSON.stringify(dl.stats));
console.log('collab stats', JSON.stringify(collab.stats));

// J: songs without musicId
const idKeys = new Set(Object.keys(ids));
let noId = 0;
for (const s of chuni) if (!s.id && !idKeys.has(s.title)) noId++;
console.log('songs without id/title-in-ids', noId);

// G: extra coverage
const extraKeys = new Set(Object.keys(extra));
let missingExtra = 0; const missList = [];
for (const s of chuni) if (!extraKeys.has(s.title)) { missingExtra++; if (missList.length < 5) missList.push(s.title); }
console.log('songs missing extra', missingExtra, missList.join(' | '));
let extraMissingZh = 0;
for (const [k, v] of Object.entries(extra)) {
  const zh = v && (v.zh || v.intro_zh || v.descZh);
  if (!zh) extraMissingZh++;
}
console.log('extra entries without zh field', extraMissingZh, 'sample keys', Object.keys(extra)[0]);

// E: removed vs A300 directory
const a300 = 'D:/SDHD - CHUNITHM Mate/HDD/bin/option/A300/music';
let a300ids = 0, a300dirs = 0;
try { const dirs = fs.readdirSync(a300); a300dirs = dirs.length; a300ids = dirs.filter(d => /^\d+$/.test(d)).length; } catch (e) { a300ids = -1; }
console.log('A300 dirs', a300dirs, 'numeric dirs', a300ids, 'removed json', removed.length);

// B: c2s vs chuni_designers
const diffMap = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4 };
let cmp = 0, mismatch = 0; const samples = [];
for (const s of chuni) {
  const c = c2s[String(s.id)] || c2s[s.id];
  if (!c) continue;
  const ds = designers[s.title] || designers[s.id];
  const arr = Array.isArray(c) ? c : (c.creators || c.c2s || []);
  for (const sh of s.sheets || []) {
    const idx = diffMap[String(sh.difficulty).toLowerCase()];
    if (idx == null || !arr || arr[idx] == null) continue;
    const a = String(arr[idx]).trim(), b = String((sh.designer) || (ds && ds[String(sh.difficulty).toLowerCase().slice(0, 1).toUpperCase()]) || '').trim();
    if (!a) continue;
    cmp++;
    if (norm(a) !== norm(b)) { mismatch++; if (samples.length < 8) samples.push(`${s.title}/${sh.difficulty}: c2s=${a} | site=${b}`); }
  }
}
console.log('c2s compared', cmp, 'mismatch', mismatch);
for (const x of samples) console.log('  ', x);

// C: constants vs lxns / cdata
const byTitle = new Map();
for (const x of lxns || []) byTitle.set(norm(x.title || x.name), x);
let c1 = 0, m1 = 0; const ms1 = [];
for (const s of chuni) {
  const l = byTitle.get(norm(s.title));
  if (!l) continue;
  for (const sh of s.sheets || []) {
    const ld = l.difficulties || l.sheets || l.charts;
    if (!ld) continue;
    const key = String(sh.difficulty).toLowerCase();
    const item = ld[key] || ld[diffMap[key]];
    if (!item) continue;
    const lv = item.level ?? item.const ?? item.internalValue;
    if (lv == null || sh.internalValue == null) continue;
    c1++;
    if (Math.abs(Number(lv) - Number(sh.internalValue)) > 0.001) { m1++; if (ms1.length < 8) ms1.push(`${s.title}/${key}: lxns=${lv} site=${sh.internalValue}`); }
  }
}
console.log('lxns const compared', c1, 'mismatch', m1);
for (const x of ms1) console.log('  ', x);
console.log('lxns song sample keys', Object.keys(lxns[0] || {}).join(','));
console.log('cdata song sample keys', Object.keys(cdata[0] || {}).join(','));
console.log('chuni song sample keys', Object.keys(chuni[0] || {}).join(','));
console.log('chuni sheet keys', Object.keys((chuni[0].sheets || [])[0] || {}).join(','));
