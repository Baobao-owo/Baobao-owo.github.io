// 重建 collab.json：只认 wiki 上明确的来源，不再做「模糊猜人」
//   1) 合作分工表（tools/../source/_data/collab_parts.json）
//   2) wiki「合作」小节里的逐曲署名（_tmp/wiki/designer-map-all.json）
//   3) 曲目页「譜面作者」行（_tmp/wiki/song-credits.json）
//   4) 手填修正（tools/designer-manual.json 的 collab 段）
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const squash = (s) => String(s || '').normalize('NFKC').replace(/[\s\u3000]+/g, '').toLowerCase();

const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const designerData = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
const credits = JSON.parse(fs.readFileSync('_tmp/wiki/song-credits.json', 'utf8'));
const parts = JSON.parse(fs.readFileSync('source/_data/collab_parts.json', 'utf8'));
const manual = JSON.parse(fs.readFileSync('tools/designer-manual.json', 'utf8'));
const OLD = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8'));

// 精确别名表（朋友 + wiki 一覧 + 手填），不做模糊
const exact = new Map();
for (const d of friend.designers || []) {
  exact.set(norm(d.name), d.name);
  for (const a of d.aliases || []) exact.set(norm(a), d.name);
}
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    if (!exact.has(norm(credit))) exact.set(norm(credit), person);
  }
}
for (const [bad, good] of Object.entries(manual.aliases || {})) exact.set(norm(bad), good);
const people = new Set(designerData.designers.filter((d) => !d.pseudo).map((d) => d.name));
for (const p of people) if (!exact.has(norm(p))) exact.set(norm(p), p);

// 已有的曲名（站内 + 删除曲）
const titleNorm = new Map();
const titleSquash = new Map();
for (const s of [...site.songs, ...removed]) {
  titleNorm.set(norm(s.title), norm(s.title));
  titleSquash.set(squash(s.title), norm(s.title));
}
const knownKey = (title) => titleNorm.get(norm(title)) || titleSquash.get(squash(title)) || null;

const SPLIT = /\s*(?:vs\.?|VS\.?|Vs\.?|＆|&|\+|＋|×|✕|と|\bwith\b|\bmeets\b|\bsupported by\b|\bfumbled by\b|\bfused with\b|\bfeat\b\.?|\bby\b)\s*/i;

function cleanToken(s) {
  return String(s || '')
    .replace(/\s*[*＊]\s*\d+\s*$/g, '')
    .replace(/^[\s:：・\-–—]+|[\s:：・\-–—]+$/g, '')
    .replace(/[「」『』“”"]/g, '')
    .trim();
}

const exactSquash = new Map();
for (const [k, v] of exact) exactSquash.set(squash(k), v);

function resolveStrict(token) {
  const t = cleanToken(token);
  if (!t) return '';
  const hit = exact.get(norm(t)) || exactSquash.get(squash(t));
  if (hit) return hit;
  // 去掉括号注释再试一次
  const stripped = cleanToken(t.replace(/[（(][^）)]*[）)]/g, ''));
  if (!stripped) return '';
  return exact.get(norm(stripped)) || exactSquash.get(squash(stripped)) || '';
}

function peopleOf(credit) {
  const tokens = String(credit || '')
    .replace(/【[^】]*】/g, '')
    .split(SPLIT)
    .map(cleanToken)
    .filter(Boolean);
  const out = [];
  for (const t of tokens) {
    const who = resolveStrict(t);
    if (who && !out.includes(who)) out.push(who);
  }
  return out;
}

const result = {};
const diffLog = [];

function setEntry(title, diff, list, source) {
  const key = knownKey(title);
  if (!key) return;
  if (list.length < 2) return;
  result[key] = result[key] || {};
  const prev = result[key][diff] || [];
  if (JSON.stringify(prev) !== JSON.stringify(list)) {
    diffLog.push({ title, diff, from: prev, to: list, source });
  }
  result[key][diff] = list;
}

// 1) 分工表
for (const entry of Object.values(parts)) {
  const list = [];
  for (const row of entry.rows) {
    const cell = row[row.length - 1];
    const names = [cleanToken(String(cell).replace(/[（(][^）)]*[）)]/g, ''))];
    for (const m of String(cell).matchAll(/[（(]([^）)]*)[）)]/g)) {
      const inner = cleanToken(m[1].replace(/^(配置代理|代理|監修|協力)[:：]\s*/, ''));
      if (inner) names.push(inner);
    }
    for (const n of names) {
      const who = resolveStrict(n) || n;
      if (who && !list.includes(who)) list.push(who);
    }
  }
  const key = knownKey(entry.title);
  if (key) {
    result[key] = result[key] || {};
    // 分工表落在「这张谱的合作难度」上：优先用旧数据记录过的难度
    const oldDiff = Object.keys(OLD.songs[entry.title] || OLD.songs[key] || {})[0];
    const diff = oldDiff || Object.keys(result[key])[0] || 'm';
    result[key][diff] = list;
    diffLog.push({ title: entry.title, diff, from: [], to: list, source: '分工表' });
  }
}

// 2) wiki「合作」小节的逐曲署名
for (const sec of sections) {
  if (!/合作/.test(sec.heading)) continue;
  for (const row of sec.rows) {
    const list = peopleOf(row.credit);
    if (list.length >= 2) setEntry(row.title, row.diff, list, 'wiki 合作');
  }
}

// 3) 曲目页「譜面作者」
for (const [title, entry] of Object.entries(credits)) {
  for (const [diff, credit] of Object.entries(entry)) {
    if (diff === 'b' || diff === 'a') continue;
    const list = peopleOf(credit);
    if (list.length >= 2) setEntry(title, diff, list, '譜面作者');
  }
}

// 4) 手填修正
for (const [title, entry] of Object.entries(manual.collab || {})) {
  const key = knownKey(title);
  if (!key) continue;
  result[key] = result[key] || {};
  for (const [diff, list] of Object.entries(entry)) {
    if (Array.isArray(list) && list.length >= 2) {
      diffLog.push({ title, diff, from: result[key][diff] || [], to: list, source: '手填' });
      result[key][diff] = list;
    }
  }
}

// 对比旧数据，记录变化
const removedEntries = [];
for (const [title, entry] of Object.entries(OLD.songs)) {
  for (const [diff, list] of Object.entries(entry)) {
    const now = (result[title] || {})[diff];
    if (!now || JSON.stringify(now) !== JSON.stringify(list)) {
      removedEntries.push({ title, diff, old: list, now: now || null });
    }
  }
}

const songs = Object.keys(result).length;
let entries = 0;
for (const e of Object.values(result)) entries += Object.keys(e).length;

fs.writeFileSync('source/assets/data/collab.json', JSON.stringify({ stats: { songs, entries }, songs: result }, null, 0), 'utf8');
fs.writeFileSync(
  '_tmp/collab-diff.json',
  JSON.stringify({ changed: diffLog, removedOrChanged: removedEntries }, null, 1),
  'utf8'
);

console.log('重建完成 曲:', songs, ' 条目:', entries);
console.log('与旧数据不同的:', removedEntries.length);
console.log('新增/修正来源统计:');
const bySource = {};
for (const d of diffLog) bySource[d.source] = (bySource[d.source] || 0) + 1;
console.log(' ', JSON.stringify(bySource));
removedEntries.slice(0, 10).forEach((r) => {
  console.log('  ✗ ' + r.title + ' [' + r.diff + '] 原: ' + r.old.join(' × ') + ' → 现: ' + (r.now ? r.now.join(' × ') : '(去掉)'));
});
