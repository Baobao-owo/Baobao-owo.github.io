// 把「其他名义」里的合作/组合型署名解析成合作谱参与者，写进 collab.json
// 结果：这些谱在「仅显示合作」打开时，点参与的任何一个人都能筛出来。
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

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    const k = norm(credit);
    if (!alias2who.has(k)) alias2who.set(k, person);
  }
}
const aliasSquashed = new Map();
for (const [k, who] of alias2who) aliasSquashed.set(squash(k), who);

function lookup(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return alias2who.get(norm(s)) || aliasSquashed.get(squash(s)) || '';
}

// 分隔规则：vs / ＆ / + / × / と / with / feat / supported by / fumbled by / by
const SPLIT = new RegExp(
  [
    '\\s*(?:vs\\.?|Vs\\.?|VS\\.?)\\s*',
    '\\s*(?:＆|&)\\s*',
    '\\s*[+＋]\\s*',
    '\\s*[×✕✖]\\s*',
    '\\s+と\\s+',
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

function peopleInCredit(credit) {
  const text = String(credit || '').normalize('NFKC');
  const tokens = text.split(SPLIT).map(cleanToken).filter(Boolean);
  const out = [];
  const add = (who) => {
    if (who && !out.includes(who)) out.push(who);
  };
  for (const tok of tokens) {
    const direct = lookup(tok);
    if (direct) {
      add(direct);
      continue;
    }
    // 段里包含某个别名（长的优先）
    const t = norm(tok);
    const hits = [];
    for (const [alias, who] of alias2who) {
      if (alias.length < 3) continue;
      if (t.includes(alias)) hits.push([alias.length, who]);
    }
    hits.sort((a, b) => b[0] - a[0]);
    if (hits.length) add(hits[0][1]);
  }
  return out;
}

let scanned = 0;
let added = 0;
let upgraded = 0;
const samples = [];
for (const [title, entry] of Object.entries(designers.songs || {})) {
  for (const diff of ['e', 'm', 'u', 'b', 'a']) {
    const cell = entry[diff];
    if (!cell || !cell.raw) continue;
    // 空白署名，或「已经归给某个人、但署名里明显还有别人」的，都要补合作信息
    const hasSeparator = SPLIT.test(String(cell.raw).normalize('NFKC'));
    if (cell.who && !hasSeparator) continue;
    scanned++;
    const people = peopleInCredit(cell.raw);
    if (people.length < 2) continue;
    const tgt = collab.songs[title] || (collab.songs[title] = {});
    if (tgt[diff] && tgt[diff].length >= 2) {
      upgraded++;
      continue;
    }
    tgt[diff] = people;
    added++;
    if (samples.length < 8) samples.push(cell.raw + ' → ' + people.join(' × ') + '  (' + title + ' ' + diff + ')');
  }
}

fs.writeFileSync(COLLAB_FILE, JSON.stringify(collab, null, 0), 'utf8');
console.log('扫到的空白署名:', scanned, ' 新增合作条目:', added, ' 已存在:', upgraded);
console.log('合作曲总数:', Object.keys(collab.songs).length);
samples.forEach((s) => console.log('  ' + s));
