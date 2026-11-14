// 把 wiki「楽曲一覧(追加日順)」解析结果落到 tools/song-addorder.json
// 结构：{ "<曲名>": { "date": "2026-10-29", "order": 1 } }
import fs from 'node:fs';

const src = JSON.parse(fs.readFileSync('_tmp/wiki/mate-addorder.json', 'utf8'));
const out = {};
for (const [title, v] of Object.entries(src)) {
  if (!v.date) continue;
  out[title] = { date: v.date, order: v.order };
}
fs.writeFileSync('tools/song-addorder.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('写入曲目:', Object.keys(out).length);
