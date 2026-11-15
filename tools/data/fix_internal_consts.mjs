// 一些谱面只有数值定数（internalValue）没有显示字符串（internal），补上
import fs from 'node:fs';

const file = 'source/_data/chuni.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let fixed = 0;
const samples = [];

for (const song of data.songs || []) {
  for (const sh of song.sheets || []) {
    if (sh.internal != null) continue;
    // WORLD'S END 谱面没有定数（只有星级），跳过
    if (/^【.*】$/.test(String(sh.difficulty))) continue;
    const v = Number(sh.internalValue);
    if (isNaN(v)) continue;
    sh.internal = v % 1 === 0 ? v.toFixed(1) : String(v);
    fixed++;
    if (samples.length < 10) samples.push(`${song.title} ${sh.difficulty}: ${sh.internal}`);
  }
}

fs.writeFileSync(file, JSON.stringify(data), 'utf8');
console.log('补上定数字符串:', fixed);
samples.forEach((x) => console.log('  ', x));
