import fs from 'node:fs';
const rd = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const files = fs.readdirSync('_tmp').filter((f) => /^batch.*\.json$/.test(f)).sort();
const items = [];
const seen = new Set();
let dup = 0;
for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync('_tmp/' + f, 'utf8')); } catch { continue; }
  if (!Array.isArray(arr)) continue;
  for (const s of arr) {
    const song = String(s.song || '').trim();
    for (const it of (s.items || [])) {
      const jp = String(it.jp || '').trim();
      const zh = String(it.zh || '').trim();
      if (!jp && !zh) continue;
      const key = song + '\u0001' + String(it.type || '') + '\u0001' + jp;
      if (seen.has(key)) { dup++; continue; }
      seen.add(key);
      items.push({ song, type: String(it.type || ''), jp, zh, note: String(it.note || ''), check: String(it.check || ''), src: f });
    }
  }
}
// zh-lines.jsonl：id -> 中文（介绍整段，按 ⏎ 分段）
const zhIds = new Set();
for (const line of fs.readFileSync('_tmp/zh-lines.jsonl', 'utf8').split('\n')) {
  const m = line.match(/^(\S+)\t([\s\S]*)$/);
  if (m) zhIds.add(m[1]);
}
const byType = {};
for (const it of items) byType[it.type] = (byType[it.type] || 0) + 1;
const out = { generatedAt: new Date().toISOString(), batches: files.length, items: items.length, duplicatesSkipped: dup, zhLineIds: zhIds.size, byType, entries: items };
fs.writeFileSync('tools/translation-index.json', JSON.stringify(out, null, 0) + '\n', 'utf8');
console.log('batches', files.length, 'items', items.length, 'dup', dup, 'zhIds', zhIds.size, JSON.stringify(byType));
