// 导出「称号文本」和「条件文本」的去重队列（按单元格翻译，避免行错位）
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

const titles = new Set();
const conds = new Set();
for (const e of Object.values(extra)) {
  if (!e.titles || e.titles.length < 2) continue;
  for (const row of e.titles.slice(1)) {
    const t = String(row[0] || '').trim();
    const c = String(row[1] || '').trim();
    if (t) titles.add(t);
    if (c) conds.add(c);
  }
}

function toQueue(set) {
  return [...set].map((s, i) => ({ k: String(i), t: s }));
}

fs.writeFileSync(ROOT + '/tools/queues/cells-titles.json', JSON.stringify(toQueue(titles)), 'utf8');
fs.writeFileSync(ROOT + '/tools/queues/cells-conds.json', JSON.stringify(toQueue(conds)), 'utf8');
fs.writeFileSync(ROOT + '/tools/queues/cells-titles-src.json', JSON.stringify([...titles]), 'utf8');
fs.writeFileSync(ROOT + '/tools/queues/cells-conds-src.json', JSON.stringify([...conds]), 'utf8');
console.log('称号单元格:', titles.size, '| 条件单元格:', conds.size);
