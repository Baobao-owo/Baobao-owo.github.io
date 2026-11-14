// 把 designers.json 里的谱师同步进生成器用的 chuni_designers.json（按字母键）
import fs from 'node:fs';

const d = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const FILE = 'source/_data/chuni_designers.json';
const out = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const LETTER = { b: 'B', a: 'A', e: 'E', m: 'M', u: 'U' };
let changed = 0;

// 用「规范化曲名 → 原始曲名」对照，避免大小写/空格差异漏掉
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const existing = new Map();
for (const k of Object.keys(out)) existing.set(norm(k), k);

for (const [title, entry] of Object.entries(d.songs || {})) {
  const key = existing.get(norm(title)) || title;
  const target = out[key] || (out[key] = {});
  for (const [diff, cell] of Object.entries(entry)) {
    const letter = LETTER[diff];
    if (!letter || !cell || !cell.who) continue;
    if (target[letter] === cell.who) continue;
    target[letter] = cell.who;
    changed++;
  }
}

fs.writeFileSync(FILE, JSON.stringify(out), 'utf8');
console.log('同步条目:', changed, ' 曲目数:', Object.keys(out).length);
const check = ['きゅうくらりん', 'Your Reality (Kenji Mizuno Remix)', 'LaVI-Bavellabion', '奇々解体', '狂命'];
for (const t of check) {
  const k = [...Object.keys(out)].find((x) => norm(x) === norm(t));
  console.log('  ', t, '=>', k ? JSON.stringify(out[k]) : '(无)');
}
