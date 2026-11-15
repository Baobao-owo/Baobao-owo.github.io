import fs from 'node:fs';
const rd = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const cdata = rd('_tmp/chunithm-data.json');
const src = rd('source/_data/chuni.json');
const norm = (t) => String(t || '').normalize('NFKC').toLowerCase().replace(/[\s\u3000]/g, '').replace(/[\[\]【】()（）「」『』!！?？'’”"・:：;；,，.。~～\-—_]/g, '');
const map = new Map();
for (const s of cdata.songs) {
  const m = {};
  for (const sh of (s.sheets || [])) {
    if (!sh || !sh.difficulty) continue;
    if (/^【/.test(String(sh.difficulty))) continue;
    m[String(sh.difficulty).toLowerCase()] = sh.internalLevelValue;
  }
  map.set(norm(s.title), { title: s.title, sheets: m });
}
const diffs = [];
let compared = 0;
for (const s of src.songs) {
  const n = map.get(norm(s.title));
  if (!n) continue;
  for (const sh of (s.sheets || [])) {
    const d = String(sh.difficulty || '').toLowerCase();
    if (!['basic','advanced','expert','master','ultima'].includes(d)) continue;
    const a = Number(sh.internalValue);
    const b = n.sheets[d];
    if (b == null || Number.isNaN(a)) continue;
    compared++;
    if (Math.abs(a - Number(b)) > 0.001) diffs.push({ title: s.title, diff: d, site: a, mirror: b });
  }
}
fs.mkdirSync('_tmp/reports', { recursive: true });
fs.writeFileSync('_tmp/reports/mirror-const-diff.tsv', 'title\tdiff\tsite\tmirror\tgap\n' + diffs.map(d => [d.title, d.diff, d.site, d.mirror, (d.site - d.mirror).toFixed(2)].join('\t')).join('\n') + '\n', 'utf8');
fs.writeFileSync('_tmp/game/chunithm-normalized.json', JSON.stringify([...map.values()], null, 0), 'utf8');
console.log('mirror songs', map.size, 'compared sheets', compared, 'diffs', diffs.length);
console.log(diffs.slice(0, 8).map(d => d.title + ' ' + d.diff + ' ' + d.site + ' vs ' + d.mirror).join('\n'));
