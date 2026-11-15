import fs from 'node:fs';
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const d = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const list = JSON.parse(fs.readFileSync('tools/designer-unknown.json', 'utf8'));
let ok = 0; const missingTitle = [], missingDiff = [], already = [], empty = [];
for (const item of list) {
  const e = d.songs[norm(item.title)];
  if (!e) { missingTitle.push(item.title); continue; }
  for (const k of item.diffs) {
    if (!e[k]) { missingDiff.push(item.title + ' / ' + k); continue; }
    if (e[k].who) { already.push(item.title + ' / ' + k + ' -> ' + e[k].who); continue; }
    if (!String(e[k].raw || '').trim()) { empty.push(item.title + ' / ' + k); continue; }
    ok++;
  }
}
console.log('可归类条目:', ok);
console.log('标题找不到:', missingTitle);
console.log('该难度没谱:', missingDiff);
console.log('已有归属:', already);
console.log('raw 为空:', empty);
const raws = new Set();
for (const item of list) {
  const e = d.songs[norm(item.title)]; if (!e) continue;
  for (const k of item.diffs) if (e[k] && !e[k].who && e[k].raw) raws.add(e[k].raw.trim());
}
const hit = d.loose.filter((x) => raws.has(x.name.trim()));
console.log('loose 里会被收走的名称数:', hit.length, '（共', d.loose.length, '条）');
console.log('举例:', hit.slice(0, 8).map((x) => x.name));
