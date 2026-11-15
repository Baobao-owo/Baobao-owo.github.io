// 统计被跳过曲目的行模式
import fs from 'node:fs';

const e = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));
const skipped = new Set(JSON.parse(fs.readFileSync('_tmp/rule-skipped.json', 'utf8')));
const done = new Set();
for (const f of fs.readdirSync('_tmp').filter((x) => /^batch\d+-.*\.json$/.test(x))) {
  try {
    for (const s of JSON.parse(fs.readFileSync('_tmp/' + f, 'utf8'))) done.add(s.song);
  } catch (err) {}
}
const shapes = new Map();
for (const [t, x] of Object.entries(e)) {
  if (done.has(t) || !skipped.has(t)) continue;
  for (const raw of String(x.wiki_comment || '').split('\n')) {
    const line = raw.trim();
    if (!line || /Font Awesome|^情報|^-->$/.test(line)) continue;
    const s = line
      .replace(/\d{4}\/\d{1,2}\/\d{1,2}/g, 'DATE')
      .replace(/\d{4}年\d{1,2}月\d{1,2}日/g, 'DATEJP')
      .replace(/「[^」]*」/g, '「…」')
      .replace(/[A-Za-z0-9０-９]+/g, 'X')
      .replace(/\s+/g, ' ');
    shapes.set(s, (shapes.get(s) || 0) + 1);
  }
}
for (const [s, c] of [...shapes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(c, '|', s);
