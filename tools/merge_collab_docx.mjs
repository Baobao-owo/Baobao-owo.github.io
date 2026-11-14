// 合并：现有 collab.json + docx 解析结果
import fs from 'node:fs';

const collabPath = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(collabPath, 'utf8'));
const docx = JSON.parse(fs.readFileSync('_tmp/build/collab-from-docx.json', 'utf8'));

const norm = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

const merged = Object.assign({}, collab.songs || {});
let added = 0;
let mergedDiffs = 0;

for (const [title, diffs] of Object.entries(docx)) {
  const key = norm(title);
  if (!merged[key]) { merged[key] = {}; added++; }
  for (const [d, ppl] of Object.entries(diffs)) {
    const k = d || 'm';
    const cur = merged[key][k] || [];
    const union = [...new Set(cur.concat(ppl))];
    if (union.length !== cur.length) mergedDiffs++;
    merged[key][k] = union;
  }
}

// 去掉没有 2 人以上难度的条目（单人名册不要）
let dropped = 0;
for (const [k, rec] of Object.entries(merged)) {
  const keep = Object.keys(rec).some((d) => (rec[d] || []).length > 1);
  if (!keep) { delete merged[k]; dropped++; }
}

collab.songs = merged;
collab.stats = Object.assign({}, collab.stats || {}, {
  songs: Object.keys(merged).length,
  charts: Object.values(merged).reduce((a, r) => a + Object.keys(r).length, 0),
});

fs.writeFileSync(collabPath, JSON.stringify(collab, null, 1) + '\n', 'utf8');
console.log('新增曲目:', added, '| 合并难度:', mergedDiffs, '| 丢弃单人条目:', dropped, '| 总合作曲:', Object.keys(merged).length);
