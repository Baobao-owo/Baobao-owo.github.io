// 把会报评论匹配到站内曲目，产出 source/_data/chuni_notes.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&]/g, '');

// 去掉曲名后面的读音说明，例如「]-[|/34<#!(ヒバチ)」
const bareTitle = (t) => String(t || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();

const recs = JSON.parse(fs.readFileSync('_tmp/wiki/note_records.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const index = new Map(); // norm(title) -> 站内 title
for (const s of site.songs) index.set(norm(s.title), s.title);
for (const s of removed) if (!index.has(norm(s.title))) index.set(norm(s.title), s.title);

// 常见术语统一（只做明显错译）
const TERM_FIX = [
  [/诺兹|诺特|音符/g, 'note'],
  [/谱面师|制谱师/g, '谱师'],
  [/分数值|定数值/g, '定数'],
];

// 合并多余空行：原文里每段之间常夹空行，直接 pre-wrap 会拉出大片空白
function tidy(text) {
  return String(text || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

// 「Techno Kitchen（嘉宾）Techno Kitchen（ゲスト）」这种重复写法，只留前半段
function cleanDesigner(name) {
  const t = String(name || '').trim();
  const m = t.match(/^(.+?)（([^）]*)）(.+)$/);
  if (m && m[3].startsWith(m[1].trim())) return m[1].trim() + '（' + m[2] + '）';
  return t;
}

function fixZh(text) {
  let t = tidy(text);
  for (const [re, to] of TERM_FIX) t = t.replace(re, to);
  return t.trim();
}

const out = {};
let matched = 0;
const unmatched = new Set();

for (const r of recs) {
  if (!r.title) continue;
  const key = norm(bareTitle(r.title));
  const song = index.get(key);
  if (!song) {
    unmatched.add(r.title);
    continue;
  }
  const item = {
    r: r.round,
    d: cleanDesigner(r.designer),
    df: r.diff || '',
    jp: tidy(r.jp),
    zh: fixZh(r.zh),
  };
  if (!item.jp && !item.zh) continue;
  if (!out[song]) out[song] = [];
  // 去重（同页同谱师同难度同曲）
  const dup = out[song].some((x) => x.r === item.r && x.d === item.d && x.df === item.df);
  if (!dup) out[song].push(item);
  matched++;
}

fs.writeFileSync('source/_data/chuni_notes.json', JSON.stringify(out, null, 0), 'utf8');
const sizes = Object.values(out).map((a) => a.length);
console.log('匹配到曲目:', Object.keys(out).length, '| 条目:', matched, '| 有日文:', Object.values(out).flat().filter((x) => x.jp).length);
console.log('单曲最多条目:', Math.max(...sizes));
console.log('未匹配标题数:', unmatched.size, '| 样本:', [...unmatched].slice(0, 10).join(' | '));
