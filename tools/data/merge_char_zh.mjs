// 把 _tmp/zh-char.jsonl（角色名润色后的重译）覆盖进 chuni_extra.json
import fs from 'node:fs';

const ROOT = process.cwd();
const EXTRA = ROOT + '/source/_data/chuni_extra.json';
const ZH = ROOT + '/_tmp/zh-char.jsonl';

const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));
let merged = 0;
if (fs.existsSync(ZH)) {
  for (const line of fs.readFileSync(ZH, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf('\t');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const zh = line.slice(i + 1).trim();
    const e = extra[key];
    if (!e || !zh) continue;
    e.wiki_comment_zh = zh;
    merged++;
  }
}
fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
console.log('覆盖', merged, '条');
