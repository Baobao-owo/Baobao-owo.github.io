// 合并占位符翻译：先把 ZKQn 换回中文术语，再写入 wiki_comment_zh
import fs from 'node:fs';

const ROOT = process.cwd();
const EXTRA = ROOT + '/source/_data/chuni_extra.json';
const BACK = JSON.parse(fs.readFileSync(ROOT + '/_tmp/zh-tokens-back.json', 'utf8'));
const files = process.argv.slice(2);

const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));
let merged = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  for (const raw of fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    if (!raw.trim()) continue;
    const i = raw.indexOf('\t');
    if (i < 0) continue;
    const key = raw.slice(0, i).trim();
    let zh = raw.slice(i + 1).replace(/⏎/g, '\n').trim();
    // 占位符换回中文（按长度倒序，避免 ZKQ1 命中 ZKQ13）
    const pairs = Object.entries(BACK).sort((a, b) => b[0].length - a[0].length);
    for (const [token, cn] of pairs) {
      zh = zh.split(token).join(cn).split(token.toLowerCase()).join(cn);
    }
    const e = extra[key];
    if (!e || !zh) continue;
    e.wiki_comment_zh = zh;
    merged++;
  }
}
fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
const keys = Object.keys(extra);
console.log('合并', merged, '| 有中文', keys.filter((k) => extra[k].wiki_comment_zh).length, '/', keys.length);
