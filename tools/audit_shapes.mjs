import fs from 'node:fs';
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/', ad = 'source/assets/data/';
const shape = (o, n = 12) => o && typeof o === 'object' ? Object.keys(o).slice(0, n).map(k => k + ':' + (Array.isArray(o[k]) ? 'arr' + o[k].length : typeof o[k] === 'object' && o[k] ? 'obj' + Object.keys(o[k]).length : String(o[k]).slice(0, 20))).join(', ') : String(o);

const chuni = read(rd + 'chuni.json');
const collab = read(ad + 'collab.json');
const dl = read(ad + 'designers.json');
const extra = read(rd + 'chuni_extra.json');
const notes = read(rd + 'chuni_notes.json');
const previews = read(rd + 'chuni_previews.json');
const ids = read(rd + 'chuni_ids.json');
const fill = read(rd + 'chuni_designer_fill.json');
const c2s = read('_tmp/game/c2s-designers-all.json');
const lxns = read('_tmp/lxns-songs.json');
const cdata = read('_tmp/chunithm-data.json');
const partsD = read(rd + 'collab_parts.json'), partsA = read(ad + 'collab-parts.json');

console.log('chuni keys:', shape(chuni));
console.log('collab keys:', Object.keys(collab));
console.log('designers keys:', Object.keys(dl));
console.log('extra keys:', shape(extra));
console.log('notes keys:', shape(notes));
console.log('previews keys:', shape(previews));
console.log('ids keys:', shape(ids));
console.log('fill keys:', shape(fill));
console.log('lxns keys:', shape(lxns));
console.log('cdata keys:', shape(cdata));
console.log('parts equal:', JSON.stringify(partsD) === JSON.stringify(partsA));
