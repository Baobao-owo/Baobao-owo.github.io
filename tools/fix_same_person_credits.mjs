// 只处理「A vs B 但 A、B 是同一个人」的署名（wonder* = Techno Kitchen）
// 页面谱师栏仍保留游戏内原文，这里只把这种自 VS 的写成一个名字
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const FILE = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const LETTER = { b: 'basic', a: 'advanced', e: 'expert', m: 'master', u: 'ultima' };
const byTitle = new Map(site.songs.map((s) => [norm(s.title), s]));

// 别名 → 人
const alias = new Map();
for (const d of friend.designers || []) {
  alias.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias.set(norm(a), d.name);
}
const manual = JSON.parse(fs.readFileSync('tools/designer-manual.json', 'utf8'));
for (const [bad, good] of Object.entries(manual.aliases || {})) alias.set(norm(bad), good);

const SPLIT = /\s*(?:vs\.?|VS\.?|Vs\.?)\s*/i;

let changed = 0;
const log = [];

for (const [title, entry] of Object.entries(designers.songs || {})) {
  const song = byTitle.get(norm(title));
  if (!song) continue;
  for (const [diff, cell] of Object.entries(entry)) {
    if (!cell || !cell.who || !cell.raw) continue;
    if (!/vs\.?/i.test(cell.raw)) continue;
    const parts = cell.raw
      .split(SPLIT)
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    const people = parts.map((p) => alias.get(norm(p)) || p);
    const uniq = [...new Set(people)];
    if (uniq.length !== 1) continue; // 只有同一个人时才处理
    const who = uniq[0];
    const c = collab.songs[title];
    if (c && c[diff] && c[diff].length >= 2) continue;
    const sh = song.sheets.find((x) => x.difficulty === LETTER[diff]);
    if (!sh || sh.designer === who) continue;
    log.push(title + ' [' + diff + '] 「' + sh.designer + '」→ ' + who);
    sh.designer = who;
    changed++;
  }
}

fs.writeFileSync(FILE, JSON.stringify(site), 'utf8');
console.log('自 VS 改成单人:', changed);
log.forEach((l) => console.log('  ' + l));
