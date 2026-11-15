import fs from 'node:fs';
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/', ad = 'source/assets/data/';
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const chuni = read(rd + 'chuni.json').songs;
const extra = read(rd + 'chuni_extra.json');
const c2s = read('_tmp/game/c2s-designers-all.json');
const lxns = read('_tmp/lxns-songs.json').songs;
const cdata = read('_tmp/chunithm-data.json').songs;
const removed = read(rd + 'chuni_removed_songs.json');

console.log('c2s entry sample', JSON.stringify(c2s['1']).slice(0, 300));
console.log('c2s entries', Object.keys(c2s).length, 'sample keys', Object.keys(c2s).slice(0, 5));
console.log('extra entry', JSON.stringify(extra[Object.keys(extra)[0]]).slice(0, 400));
console.log('removed ids sample', removed.slice(0, 3).map(r => r.id));
console.log('lxns diffs sample', JSON.stringify(lxns[0].difficulties).slice(0, 300));
console.log('cdata sheet sample', JSON.stringify(cdata[0].sheets || cdata[0]).slice(0, 300));

// constants compare v2 (skip 0/absent)
const byTitle = new Map();
for (const x of lxns) byTitle.set(norm(x.title), x);
const map = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4, we: 5 };
let c1 = 0, m1 = 0; const ms1 = [];
for (const s of chuni) {
  const l = byTitle.get(norm(s.title));
  if (!l) continue;
  for (const sh of s.sheets || []) {
    const key = String(sh.difficulty).toLowerCase();
    const item = (l.difficulties || {})[key] || (l.difficulties || {})[map[key]];
    if (!item) continue;
    const lv = Number(item.level ?? item.const ?? item.internalValue);
    if (!lv) continue;
    if (sh.internalValue == null) continue;
    c1++;
    if (Math.abs(lv - Number(sh.internalValue)) > 0.001) { m1++; if (ms1.length < 12) ms1.push(`${s.title}/${key}: lxns=${lv} site=${sh.internalValue}`); }
  }
}
console.log('lxns real compare', c1, 'mismatch', m1);
for (const x of ms1) console.log('  ', x);

// cdata compare
const cdBy = new Map();
for (const x of cdata) cdBy.set(norm(x.title), x);
let c2 = 0, m2 = 0; const ms2 = [];
for (const s of chuni) {
  const l = cdBy.get(norm(s.title));
  if (!l) continue;
  for (const sh of s.sheets || []) {
    const key = String(sh.difficulty).toLowerCase();
    const arr = l.sheets || [];
    const item = Array.isArray(arr) ? arr.find(x => String(x.difficulty || x.type).toLowerCase() === key) : arr[key];
    if (!item) continue;
    const iv = item.internalValue ?? item.const ?? item.levelDecimal;
    if (iv == null) continue;
    c2++;
    if (Math.abs(Number(iv) - Number(sh.internalValue)) > 0.001) { m2++; if (ms2.length < 12) ms2.push(`${s.title}/${key}: cdata=${iv} site=${sh.internalValue}`); }
  }
}
console.log('cdata compare', c2, 'mismatch', m2);
for (const x of ms2) console.log('  ', x);

// 版本原值 vs 显示
const vers = new Map();
for (const s of chuni) vers.set(s.version, (vers.get(s.version) || 0) + 1);
console.log('versions', [...vers.entries()].map(([k, v]) => `${k}=${v}`).join(' | '));
