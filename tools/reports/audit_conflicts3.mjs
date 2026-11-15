import fs from 'node:fs';
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/', ad = 'source/assets/data/';
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const chuni = read(rd + 'chuni.json').songs;
const designers = read(rd + 'chuni_designers.json');
const c2s = read('_tmp/game/c2s-designers-all.json');
const lxns = read('_tmp/lxns-songs.json').songs;
const cdata = read('_tmp/chunithm-data.json').songs;
const extra = read(rd + 'chuni_extra.json');
const removed = read(rd + 'chuni_removed_songs.json');
const notes = read(rd + 'chuni_notes.json');
const idx = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4, we: 5 };

// c2s vs site designer (raw)
let cmp = 0, mism = 0; const ms = [];
for (const s of chuni) {
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    if (i == null) continue;
    const a = c2s[`${s.id}_${i}`];
    if (!a) continue;
    const b = String(sh.designer || '').trim();
    if (!b) continue;
    cmp++;
    if (norm(a) !== norm(b)) { mism++; if (ms.length < 10) ms.push(`${s.title}/${sh.difficulty}: c2s=${a} | site=${b}`); }
  }
}
console.log('c2s vs site: compared', cmp, 'mismatch', mism);
for (const x of ms) console.log('  ', x);

// lxns constants
const lxBy = new Map(); for (const x of lxns) lxBy.set(norm(x.title), x);
let c1 = 0, m1 = 0; const ms1 = [];
for (const s of chuni) {
  const l = lxBy.get(norm(s.title)); if (!l) continue;
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    const it = (l.difficulties || []).find(d => d.difficulty === i);
    if (!it || sh.internalValue == null) continue;
    const lv = Number(it.level_value);
    if (!lv) continue;
    c1++;
    if (Math.abs(lv - Number(sh.internalValue)) > 0.001) { m1++; if (ms1.length < 10) ms1.push(`${s.title}/${sh.difficulty}: lxns=${lv} site=${sh.internalValue}`); }
  }
}
console.log('lxns const: compared', c1, 'mismatch', m1);
for (const x of ms1) console.log('  ', x);

// cdata constants
const cdBy = new Map(); for (const x of cdata) cdBy.set(norm(x.title), x);
let c2 = 0, m2 = 0; const ms2 = [];
for (const s of chuni) {
  const l = cdBy.get(norm(s.title)); if (!l) continue;
  for (const sh of s.sheets || []) {
    const i = idx[String(sh.difficulty).toLowerCase()];
    const it = (l.sheets || []).find(d => String(d.type || d.difficulty).toLowerCase() === String(sh.difficulty).toLowerCase() || d.type === i);
    if (!it) continue;
    const iv = it.internalValue ?? it.const;
    if (iv == null || sh.internalValue == null) continue;
    c2++;
    if (Math.abs(Number(iv) - Number(sh.internalValue)) > 0.001) { m2++; if (ms2.length < 10) ms2.push(`${s.title}/${sh.difficulty}: cdata=${iv} site=${sh.internalValue}`); }
  }
}
console.log('cdata const: compared', c2, 'mismatch', m2);
for (const x of ms2) console.log('  ', x);

// extra keys coverage: jp / zh fields
const ek = Object.keys(extra);
const fieldNames = new Set(); for (const k of ek.slice(0, 50)) for (const f of Object.keys(extra[k])) fieldNames.add(f);
console.log('extra fields', [...fieldNames].join(','));
let noZh = 0; for (const k of ek) { const v = extra[k]; const zh = v.zh || v.intro_zh || v.translation_zh || (v.zh_intro); if (!zh) noZh++; }
console.log('extra entries', ek.length, 'without obvious zh field', noZh);

// removed id format
console.log('removed first id', removed[0].id, '| notes titles sample', Object.keys(notes).slice(0, 3));
