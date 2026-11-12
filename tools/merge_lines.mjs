// 合并逐行翻译结果（可传多个文件，后面的覆盖前面的）
import fs from 'node:fs';

const ROOT = process.cwd();
const EXTRA = ROOT + '/source/_data/chuni_extra.json';
const files = process.argv.slice(2);
if (!files.length) files.push(ROOT + '/_tmp/zh-lines.jsonl');

const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));
let merged = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  for (const raw of fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    if (!raw.trim()) continue;
    const i = raw.indexOf('\t');
    if (i < 0) continue;
    const key = raw.slice(0, i).trim();
    const zh = raw.slice(i + 1).replace(/⏎/g, '\n').trim();
    const e = extra[key];
    if (!e || !zh) continue;
    e.wiki_comment_zh = zh;
    merged++;
  }
}
fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
const keys = Object.keys(extra);
console.log('合并', merged, '| 有中文', keys.filter((k) => extra[k].wiki_comment_zh).length, '/', keys.length);
