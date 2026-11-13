// 补一轮合作解析：署名的每个片段先精确对别名，再「唯一包含」兜底
// 例：レモンとアロエ → レモン(唯一含「レモン」的谱师=じゃこレモン) × アロエ(夕凪アロエ)
// 结果写进 collab.json：仅显示合作时，点其中任何一个人都能筛到这首歌。
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const squash = (s) => String(s || '').replace(/[\s\u3000]+/g, '').toLowerCase();

const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const COLLAB_FILE = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(COLLAB_FILE, 'utf8'));

// 人名 → 干净的别名（排除合作串）
const SEP = /(vs|VS|＆|&|\+|×|と|with|feat|supported|meet|and|／|\/|、|,)/i;
const whoAliases = new Map();
for (const d of friend.designers || []) {
  const list = [d.name, ...(d.aliases || [])].filter((a) => a && !SEP.test(a));
  whoAliases.set(d.name, list.map((a) => ({ raw: a, k: norm(a) })));
}
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    if (SEP.test(credit)) continue;
    const arr = whoAliases.get(person) || [];
    arr.push({ raw: credit, k: norm(credit) });
    whoAliases.set(person, arr);
  }
}

const exact = new Map();
for (const [who, list] of whoAliases) for (const a of list) exact.set(a.k, who);

function resolveToken(tok) {
  const t = norm(tok);
  if (!t || t.length < 2) return '';
  if (exact.has(t)) return exact.get(t);

  const primary = [...whoAliases.keys()].filter((w) => !/合作|不明/.test(w));
  const pick = (pred) => {
    const hits = primary.filter(pred);
    return hits.length === 1 ? hits[0] : '';
  };

  // 1) 正名以这段字结尾（レモン → じゃこレモン）
  let hit = pick((who) => norm(who).endsWith(t));
  if (hit) return hit;
  // 2) 正名包含（ペンギン → ロシェ＠ペンギン）
  hit = pick((who) => norm(who).includes(t));
  if (hit) return hit;
  // 3) 干净别名包含
  const hits = new Set();
  for (const [who, list] of whoAliases) {
    for (const a of list) {
      if (a.k.length >= 2 && a.k.includes(t)) {
        hits.add(who);
        break;
      }
    }
  }
  return hits.size === 1 ? [...hits][0] : '';
}

const SPLIT = new RegExp(
  [
    '\\s*(?:vs\\.?|Vs\\.?|VS\\.?)\\s*',
    '\\s*(?:＆|&)\\s*',
    '\\s*[+＋]\\s*',
    '\\s*[×✕✖]\\s*',
    '\\s*と\\s*',
    '\\s+and\\s+',
    '\\s+meets\\s+',
    '\\s+with\\s+',
    '\\s+supported by\\s+',
    '\\s+fumbled by\\s+',
    '\\s+fused with\\s+',
    '\\s+feat\\.?\\s*',
    '\\s+by\\s+',
    '\\s*／\\s*',
    '\\s*\\/\\s*',
    '\\s*、\\s*',
    '\\s*,\\s*',
    '\\s*，\\s*',
  ].join('|'),
  'i'
);

function cleanToken(s) {
  return String(s || '')
    .replace(/[*＊]\s*\d+\s*$/g, '')
    .replace(/^[\s:：・\-–—]+|[\s:：・\-–—]+$/g, '')
    .replace(/[「」『』“”"]/g, '')
    .trim();
}

function peopleIn(credit) {
  const text = String(credit || '').normalize('NFKC');
  const tokens = text.split(SPLIT).map(cleanToken).filter(Boolean);
  const out = [];
  for (const tok of tokens) {
    const who = resolveToken(tok);
    if (who && !out.includes(who)) out.push(who);
  }
  return out;
}

let scanned = 0;
let added = 0;
const samples = [];
for (const [title, entry] of Object.entries(designers.songs || {})) {
  for (const diff of ['e', 'm', 'u', 'b', 'a']) {
    const cell = entry[diff];
    if (!cell || !cell.raw) continue;
    if (cell.who && !SPLIT.test(String(cell.raw))) continue;
    scanned++;
    const people = peopleIn(cell.raw);
    if (people.length < 2) continue;
    const tgt = collab.songs[title] || (collab.songs[title] = {});
    if (tgt[diff] && tgt[diff].length >= 2) continue;
    tgt[diff] = people;
    added++;
    if (samples.length < 10) samples.push(cell.raw + ' → ' + people.join(' × ') + '  (' + title + ' ' + diff + ')');
  }
}

fs.writeFileSync(COLLAB_FILE, JSON.stringify(collab, null, 0), 'utf8');
console.log('扫描:', scanned, ' 新增合作条目:', added, ' 合作曲:', Object.keys(collab.songs).length);
samples.forEach((s) => console.log('  ' + s));
