// 把 _tmp/zh.jsonl 里的译文合并进 chuni_extra.json（容错 BOM）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXTRA = path.join(ROOT, 'source/_data/chuni_extra.json');
const ZH = path.join(ROOT, '_tmp/zh.jsonl');

const raw = fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, '');
const extra = JSON.parse(raw);
let merged = 0;

if (fs.existsSync(ZH)) {
  for (const line of fs.readFileSync(ZH, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf('\t');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const zh = line.slice(idx + 1).trim();
    if (!key || !zh) continue;
    const e = extra[key];
    if (!e) continue;
    e.wiki_comment_zh = zh;
    merged++;
  }
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
const keys = Object.keys(extra);
console.log('合并', merged, '| 有中文', keys.filter((k) => extra[k] && extra[k].wiki_comment_zh).length, '/', keys.length);
