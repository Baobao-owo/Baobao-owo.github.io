// 用「合作分工」表里的担当ND，替换/补全 collab.json 里对应曲目的参与者
// —— 这样「仅显示合作」时点分工表里的任何一个人都能筛到这首歌。
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const squash = (s) => String(s || '').replace(/[\s\u3000]+/g, '').toLowerCase();

const PARTS = 'source/_data/collab_parts.json';
const COLLAB = 'source/assets/data/collab.json';
const parts = JSON.parse(fs.readFileSync(PARTS, 'utf8'));
const collab = JSON.parse(fs.readFileSync(COLLAB, 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
const knownNames = new Set(designers.designers.filter((d) => !d.pseudo).map((d) => d.name));
const aliasSquashed = new Map();
for (const [k, who] of alias2who) aliasSquashed.set(squash(k), who);
for (const n of knownNames) aliasSquashed.set(squash(n), n);

function resolve(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  return alias2who.get(norm(raw)) || aliasSquashed.get(squash(raw)) || '';
}

// 「羽田の白い彗星(配置代理：ぴちネコ)」→ 拆出括号里的补充人名
function splitNames(cell) {
  const text = String(cell || '');
  const names = [];
  const main = text.replace(/[（(][^）)]*[）)]/g, '').trim();
  if (main) names.push(main);
  for (const m of text.matchAll(/[（(]([^）)]*)[）)]/g)) {
    const inner = m[1].replace(/^(配置代理|代理|監修|協力)[:：]\s*/, '').trim();
    if (inner) names.push(inner);
  }
  return names.filter(Boolean);
}

let touched = 0;
const report = [];
for (const [key, entry] of Object.entries(parts)) {
  const normKey = norm(entry.title);
  const collabKey = Object.keys(collab.songs).find((k) => norm(k) === normKey) || normKey;
  const existing = collab.songs[collabKey] || {};
  // 分工表通常是合作那张谱（多数是 MASTER，ジングルベル 是 ULTIMA）
  const diff = Object.keys(existing).sort((a, b) => (existing[b] || []).length - (existing[a] || []).length)[0] || 'm';

  const people = [];
  for (const row of entry.rows) {
    const cell = row[row.length - 1];
    for (const n of splitNames(cell)) {
      const who = resolve(n) || n;
      if (who && !people.includes(who)) people.push(who);
    }
  }
  if (people.length < 2) continue;
  const before = (existing[diff] || []).length;
  collab.songs[collabKey] = existing;
  existing[diff] = people;
  touched++;
  report.push(entry.title + ' [' + diff + '] ' + before + '人 → ' + people.length + '人: ' + people.join(' × '));
}

fs.writeFileSync(COLLAB, JSON.stringify(collab, null, 0), 'utf8');
console.log('按分工表更新的曲目:', touched, ' 合作曲总数:', Object.keys(collab.songs).length);
report.forEach((r) => console.log('  ' + r));
