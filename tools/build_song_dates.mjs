// 从已翻好的 wiki 数据里抽每首歌的首次配信日期
// 来源：chuni_extra.json 的 wiki_info.解禁方法（形如 "2022/10/13 通常配信 2025/7/16 配信停止"）
// 输出：tools/song-dates.json  { "<曲名>": "YYYY-MM-DD" }
import fs from 'node:fs';

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));
const out = {};
let n = 0;
let skipped = 0;

for (const [title, v] of Object.entries(extra)) {
  const how = (v && v.wiki_info && v.wiki_info['解禁方法']) || '';
  const m = String(how).match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) {
    skipped++;
    continue;
  }
  const date = m[1] + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[3]).padStart(2, '0');
  out[title] = date;
  n++;
}

fs.writeFileSync('tools/song-dates.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('抽到日期:', n, ' 没写日期:', skipped);

const byYear = {};
for (const d of Object.values(out)) {
  const y = d.slice(0, 4);
  byYear[y] = (byYear[y] || 0) + 1;
}
console.log('按年份:', JSON.stringify(byYear));
