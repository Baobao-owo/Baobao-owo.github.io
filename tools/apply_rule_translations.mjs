// 把规则翻译结果写入 wiki_comment_zh
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXTRA = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/rule-translated.json'), 'utf8'));

let n = 0;
for (const r of rules) {
  const e = extra[r.song];
  if (!e) continue;
  e.wiki_comment_zh = r.zh;
  n++;
}
fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
console.log('写入规则翻译:', n);
