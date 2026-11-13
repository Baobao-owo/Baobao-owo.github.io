// 从 wiki「譜面制作者一覧」的「譜面製作者不明」「合作」两个小节里取数据
//   不明 → tools/designer-unknown.json（补全）
//   合作 → 解析署名里的参与者，写进 source/assets/data/collab.json（和现有数据合并）
//
// 合作署名形态很杂：A vs B / A and B / A + B / A×B / A と B / A supported by B /
// A fumbled by B / A feat.B / 怪盗団「A」 / A*3 …… 这里尽量都拆开。
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));

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

const UNKNOWN_HEAD = /不明/;
const COLLAB_HEAD = /合作/;

// ---------- 不明 ----------
const unknownRows = [];
for (const s of sections) {
  if (!UNKNOWN_HEAD.test(s.heading)) continue;
  for (const r of s.rows) unknownRows.push({ title: r.title, diff: r.diff });
}
const unknownOut = new Map();
for (const r of unknownRows) {
  if (!unknownOut.has(r.title)) unknownOut.set(r.title, new Set());
  unknownOut.get(r.title).add(r.diff);
}
const unknownJson = [...unknownOut.entries()]
  .map(([title, set]) => ({ title, diffs: [...set].sort() }))
  .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
fs.writeFileSync('tools/designer-unknown.json', JSON.stringify(unknownJson, null, 1) + '\n', 'utf8');
console.log('不明: 行', unknownRows.length, ' 曲', unknownJson.length);

// ---------- 合作 ----------
// 分隔符：包含日文「と」、英文 by/fumbled by/meets、星号脚注等
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

// 去掉署名里的星号脚注、残留括号引号
function cleanToken(s) {
  return String(s || '')
    .replace(/[*＊]\s*\d+\s*$/g, '')
    .replace(/^[\s:：・\-–—]+|[\s:：・\-–—]+$/g, '')
    .replace(/[「」『』]/g, '')
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
    // 1) 整段就是某个别名
    add(alias2who.get(norm(tok)));
    // 2) 段里包含某个别名（长别名优先，避免子串误伤）
    if (!alias2who.get(norm(tok))) {
      const t = norm(tok);
      const hits = [];
      for (const [alias, who] of alias2who) {
        if (alias.length < 3) continue;
        if (t.includes(alias)) hits.push([alias.length, who]);
      }
      hits.sort((a, b) => b[0] - a[0]);
      if (hits.length) add(hits[0][1]);
    }
  }
  return out;
}

const collabRows = [];
for (const s of sections) {
  if (!COLLAB_HEAD.test(s.heading)) continue;
  for (const r of s.rows) collabRows.push(r);
}
console.log('合作: 行', collabRows.length);

let resolved2 = 0;
const wikiCollab = {};
const unresolved = [];
for (const r of collabRows) {
  const people = peopleInCredit(r.credit);
  if (people.length < 2) {
    if (unresolved.length < 10) unresolved.push(r.credit);
    continue;
  }
  resolved2++;
  const key = norm(r.title);
  wikiCollab[key] = wikiCollab[key] || {};
  const bucket = wikiCollab[key][r.diff] || [];
  for (const p of people) if (!bucket.includes(p)) bucket.push(p);
  wikiCollab[key][r.diff] = bucket;
}
console.log('能解析出 ≥2 人的合作行:', resolved2, ' 涉及曲:', Object.keys(wikiCollab).length);
console.log('解析不了的样本:', unresolved.slice(0, 5).join(' | '));

const COLLAB_FILE = 'source/assets/data/collab.json';
const cur = JSON.parse(fs.readFileSync(COLLAB_FILE, 'utf8'));
let added = 0;
for (const [title, diffs] of Object.entries(wikiCollab)) {
  const tgt = cur.songs[title] || (cur.songs[title] = {});
  for (const [d, people] of Object.entries(diffs)) {
    if (tgt[d] && tgt[d].length >= 2) continue;
    tgt[d] = people;
    added++;
  }
}
fs.writeFileSync(COLLAB_FILE, JSON.stringify(cur, null, 0), 'utf8');
console.log('合并进 collab.json 的难度条目:', added, ' 现有曲:', Object.keys(cur.songs).length);
