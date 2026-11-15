// 合并多份 c2s 谱师数据（游戏本体的 data/A000 优先）
import fs from 'node:fs';

const files = [
  ['_tmp/game/c2s-designers-all.json', 0],
  ['_tmp/game/c2s-designers-data.json', 1], // 优先级更高
];
const out = {};
for (const [f, prio] of files) {
  if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [k, v] of Object.entries(j)) {
    if (!v) continue;
    out[k] = v; // 后读的（data）覆盖前面的
  }
}
fs.writeFileSync('_tmp/game/c2s-designers-all.json', JSON.stringify(out, null, 0), 'utf8');
console.log('合并后 key 数:', Object.keys(out).length);
