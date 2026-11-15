import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const chuni = J('source/_data/chuni.json');
const tsv = fs.readFileSync('_tmp/reports/version-backfill.tsv', 'utf8').trim().split(/\r?\n/);
const fill = new Map();
let inFill = true;
for (const line of tsv.slice(1)) {
  if (!line.trim()) continue;
  if (line.startsWith('未能回填')) { inFill = false; continue; }
  if (!inFill) continue;
  const parts = line.split('\t');
  if (parts.length >= 4) fill.set(parts[0], parts[3]);
}
let n = 0;
for (const s of chuni.songs) {
  if ((s.version == null || s.version === 'null') && fill.has(s.title)) { s.version = fill.get(s.title); n++; }
}
fs.writeFileSync('source/_data/chuni.json', JSON.stringify(chuni, null, 0), 'utf8');
console.log('filled', n, 'remaining null', chuni.songs.filter(s => s.version == null || s.version === 'null').length);
