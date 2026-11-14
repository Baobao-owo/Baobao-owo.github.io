// 用曲目页的「譜面作者」修正/补齐 collab.json 的参与者，供「仅显示合作」筛选
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const squash = (s) => String(s || '').replace(/[\s\u3000]+/g, '').toLowerCase();

const COLLAB = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(COLLAB, 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const credits = JSON.parse(fs.readFileSync('_tmp/wiki/song-credits.json', 'utf8'));
const parts = JSON.parse(fs.readFileSync('source/_data/collab_parts.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
const aliasSquashed = new Map();
for (const [k, who] of alias2who) aliasSquashed.set(squash(k), who);
for (const d of designers.designers || []) aliasSquashed.set(squash(d.name), d.name);

function resolve(name) {
  const raw = String(name || '').replace(/\*\d+$/, '').trim();
  if (!raw) return '';
  return alias2who.get(norm(raw)) || aliasSquashed.get(squash(raw)) || '';
}

const SPLIT = /\s*(?:vs\.?|VS\.?|Vs\.?|＆|&|\+|＋|×|✕|と|with|meets|supported by|fumbled by|fused with|feat\.?|by)\s*/i;

function peopleOf(credit) {
  const parts = String(credit || '')
    .replace(/【[^】]*】/g, '')
    .split(SPLIT)
    .map((x) => x.replace(/[（(][^）)]*[）)]/g, '').trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    const who = resolve(p) || p;
    if (who && !out.includes(who)) out.push(who);
  }
  return out;
}

function keyOf(title) {
  const n = norm(title);
  return Object.keys(collab.songs).find((k) => norm(k) === n) || null;
}

let updated = 0;
const log = [];
for (const [title, entry] of Object.entries(credits)) {
  const key = keyOf(title);
  if (!key) continue;
  for (const [diff, credit] of Object.entries(entry)) {
    if (diff === 'b' || diff === 'a') continue;
    const people = peopleOf(credit);
    if (people.length < 2) continue;
    const tgt = collab.songs[key] || (collab.songs[key] = {});
    const before = (tgt[diff] || []).join(' × ');
    if (before === people.join(' × ')) continue;
    tgt[diff] = people;
    updated++;
    log.push(title + ' [' + diff + '] ' + people.join(' × ') + (before ? '   (原: ' + before + ')' : ''));
  }
}

// 分工表优先（比署名更细）
for (const entry of Object.values(parts)) {
  const key = keyOf(entry.title);
  if (!key) continue;
  const tgt = collab.songs[key] || (collab.songs[key] = {});
  const diff = Object.keys(tgt).sort((a, b) => (tgt[b] || []).length - (tgt[a] || []).length)[0] || 'm';
  const people = [];
  for (const row of entry.rows) {
    const cell = row[row.length - 1];
    const names = [cell.replace(/[（(][^）)]*[）)]/g, '').trim()];
    for (const m of String(cell).matchAll(/[（(]([^）)]*)[）)]/g)) {
      const inner = m[1].replace(/^(配置代理|代理|監修|協力)[:：]\s*/, '').trim();
      if (inner) names.push(inner);
    }
    for (const n of names) {
      const who = resolve(n) || n;
      if (who && !people.includes(who)) people.push(who);
    }
  }
  if (people.length >= 2) tgt[diff] = people;
}

fs.writeFileSync(COLLAB, JSON.stringify(collab, null, 0), 'utf8');
console.log('按谱面作者更新:', updated, ' 条');
log.forEach((l) => console.log('  ' + l));
