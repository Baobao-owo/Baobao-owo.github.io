import fs from 'node:fs';

const FILE = 'source/_data/collab_parts.json';
const parts = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const key = Object.keys(parts).find((k) => k.includes('玩具狂奏曲'));
const entry = parts[key];
// wiki 里「再編成(MAS)」和「まとめ役」共用右侧单元格（rowspan），补成两行
if (entry.rows.length && entry.rows[0][0] === 'まとめ役' && entry.rows[1].length === 1) {
  entry.rows[1] = [entry.rows[1][0], entry.rows[0][1]];
  console.log('补上再編成(MAS) 行:', JSON.stringify(entry.rows.slice(0, 2)));
}
fs.writeFileSync(FILE, JSON.stringify(parts, null, 1) + '\n', 'utf8');

// 合作参与者：用分工表里的人名
const COLLAB = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(COLLAB, 'utf8'));
const people = [];
for (const r of entry.rows) {
  const who = String(r[r.length - 1] || '').trim();
  if (who && !people.includes(who)) people.push(who);
}
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const ck = Object.keys(collab.songs).find((k) => norm(k) === norm(entry.title)) || norm(entry.title);
collab.songs[ck] = collab.songs[ck] || {};
collab.songs[ck].m = people;
fs.writeFileSync(COLLAB, JSON.stringify(collab, null, 0), 'utf8');
console.log('合作参与者:', people.join(' × '));
