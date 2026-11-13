// 建立 HDD 里 WE 谱面索引：id → c2s 路径
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['D:/XVX/opt', 'D:/XVX/HDD/data'];
const index = {};

function walk(dir, depth) {
  if (depth > 6) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else {
      const m = e.name.match(/^(\d+)_05\.c2s$/);
      if (m && !index[Number(m[1])]) index[Number(m[1])] = p;
    }
  }
}

for (const r of ROOTS) walk(r, 0);
const ids = Object.keys(index).map(Number);
console.log('WE c2s 索引:', ids.length, '| 范围', Math.min(...ids), '-', Math.max(...ids));
fs.writeFileSync('_tmp/hdd-we-charts.json', JSON.stringify(index), 'utf8');
