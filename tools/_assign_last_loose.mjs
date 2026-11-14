import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const loose = d.loose.map((x) => x.name);
const p = 'tools/designer-manual.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
for (const n of loose) m.aliases[n] = '制作者不明';
fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('补进:', JSON.stringify(loose));
