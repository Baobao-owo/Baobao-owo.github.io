// 称号列里被塞进来的「※…」备注：日文原格没有，说明翻译时串行了，砍掉只留称号名
import fs from 'node:fs';

const FILE = 'source/_data/chuni_extra.json';
const ex = JSON.parse(fs.readFileSync(FILE, 'utf8'));

let fixed = 0;
const samples = [];
for (const [title, v] of Object.entries(ex)) {
  const ja = v.titles || [];
  const zh = v.titles_zh || [];
  for (let i = 1; i < zh.length; i++) {
    const jaCell = (ja[i] && ja[i][0]) || '';
    let cell = String((zh[i] && zh[i][0]) || '');
    if (!cell) continue;
    // 日文称号格里没有 ※ 备注，中文却有 → 截断
    if (!/※/.test(jaCell) && /（?※/.test(cell)) {
      const cut = cell.search(/[（(]?※/);
      const trimmed = cell.slice(0, cut).replace(/[\s（(【]+$/, '').trim();
      if (trimmed && trimmed !== cell) {
        zh[i][0] = trimmed;
        fixed++;
        if (samples.length < 5) samples.push(title + ' :: ' + cell.slice(0, 40) + ' → ' + trimmed);
      }
    }
  }
  v.titles_zh = zh;
}

fs.writeFileSync(FILE, JSON.stringify(ex), 'utf8');
console.log('截断称号格:', fixed);
samples.forEach((s) => console.log('  ' + s));
