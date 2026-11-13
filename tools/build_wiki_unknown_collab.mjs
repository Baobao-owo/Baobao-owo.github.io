// 从 wiki「譜面制作者一覧」的「譜面製作者不明」「合作」两个小节里取数据
//   不明 → tools/designer-unknown.json（补全）
//   合作 → 解析署名里的参与者，写进 source/assets/data/collab.json（和现有数据合并）
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
// 上一轮从 1-6 页抽出来的额外别名也吃进来
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    const k = norm(credit);
    if (!alias2who.has(k)) alias2who.set(k, person);
  }
}

const UNKNOWN_HEAD = /不明/;
const COLLAB_HEAD = /合作/;

// ---- 不明 ----
const unknownRows = [];
for (const s of sections) {
  if (!UNKNOWN_HEAD.test(s.heading)) continue;
  for (const r of s.rows) unknownRows.push({ title: r.title, diff: r.diff });
}
const unknownOut = new Map();
for (const r of unknownRows) {
  const key = r.title;
  if (!unknownOut.has(key)) unknownOut.set(key, new Set());
  unknownOut.get(key).add(r.diff);
}
const unknownJson = [...unknownOut.entries()]
  .map(([title, set]) => ({ title, diffs: [...set].sort() }))
  .sort((a, b) => a.title.localeCompare(b.title, 'ja'));
fs.writeFileSync('tools/designer-unknown.json', JSON.stringify(unknownJson, null, 1) + '\n', 'utf8');
console.log('不明: 行', unknownRows.length, ' 曲', unknownJson.length);

// ---- 合作 ----
const SPLIT = /\s*(?:vs\.?|VS\.?|Vs\.?|＆|&|\+|＋|×|with|meets|supported by|fused with|and|／|\/|、|,|，)\s*/i;
function peopleInCredit(credit) {
  const parts = String(credit || '')
    .normalize('NFKC')
    .split(SPLIT)
    .map((x) => x.trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    const who = alias2who.get(norm(p));
    if (who && !out.includes(who)) out.push(who);
  }
  // 整串也试一次（有些署名不带分隔符）
  if (!out.length) {
    const who = alias2who.get(norm(credit));
    if (who) out.push(who);
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
    if (unresolved.length < 15) unresolved.push(r.credit);
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
console.log('解析不了的样本:', unresolved.slice(0, 6).join(' | '));

// 和现有 collab.json 合并（现有优先，不覆盖）
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
