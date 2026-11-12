// 导出待翻译条目，给 PowerShell 翻译脚本用（避免 PS 解析大 JSON 出问题）
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8'));

const done = new Set();
const ZH = ROOT + '/_tmp/zh.jsonl';
if (fs.existsSync(ZH)) {
  for (const line of fs.readFileSync(ZH, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf('\t');
    if (i > 0) done.add(line.slice(0, i));
  }
}

const pending = [];
for (const [k, e] of Object.entries(extra)) {
  if (!e) continue;
  const ja = e.wiki_comment || e.wiki_jp;
  if (!ja) continue;
  if (e.wiki_comment_zh) continue;
  if (done.has(k)) continue;
  pending.push({ k, t: String(ja).slice(0, 4500) });
}

fs.writeFileSync(ROOT + '/_tmp/zh-pending.json', JSON.stringify(pending), 'utf8');
console.log('导出待翻译:', pending.length);
