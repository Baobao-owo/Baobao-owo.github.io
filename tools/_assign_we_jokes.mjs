import fs from 'node:fs';
const p = 'tools/designer-manual.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
const names = [
  '[<>I7&:]/[<><\\>57&12',
  '#FR33D0MP1221C4T',
  'maimai譜面ボーイズからの挑戦ﾝl犬',
  'Revo@LC cooperated with 譜面-100号',
  'Sacred key "Mistilteinn"',
  'りょっかとレモン',
  'ι″ャ⊇∠E･/',
];
for (const n of names) m.aliases[n] = '制作者不明';
fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('aliases:', Object.keys(m.aliases).length);
