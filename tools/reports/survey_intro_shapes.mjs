// 统计介绍行模式，辅助规则化翻译
import fs from 'node:fs';

const e = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));
const shapes = new Map();
const lines = [];
for (const [t, x] of Object.entries(e)) {
  for (const raw of String(x.wiki_comment || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/Font Awesome|^情報|^-->$/.test(line)) continue;
    lines.push(line);
    let s = line
      .replace(/\d{4}\/\d{1,2}\/\d{1,2}/g, 'DATE')
      .replace(/\d{4}年\d{1,2}月\d{1,2}日/g, 'DATEJP')
      .replace(/[A-Za-z0-9０-９]+/g, 'X')
      .replace(/「[^」]*」/g, '「…」')
      .replace(/\s+/g, ' ');
    shapes.set(s, (shapes.get(s) || 0) + 1);
  }
}
const top = [...shapes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
for (const [s, c] of top) console.log(c, '|', s);
console.log('total lines', lines.length, 'unique shapes', shapes.size);
