// 从 arcade-songs 快照（songs.min.json）生成前端用的谱师索引。
// 用法：
//   node tools/build_designers.mjs [源文件路径]
// 产物：source/assets/data/designers.json
//
// 结构：
//   { generatedAt, stats, designers:[{name,charts,songs,aliases}], loose:[{name,songs}],
//     songs: { "<规范化曲名>": { e:{who,raw}, m:{who,raw}, u:{who,raw} } } }

import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || 'D:/QQ/Downloads/songs.min.json';
const OUT = 'source/assets/data/designers.json';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

if (!fs.existsSync(SRC)) {
  console.error('找不到源文件：' + SRC);
  process.exit(1);
}

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const designers = src.designers || [];
const songs = src.songs || [];

// 别名 → 谱师名
const alias2who = new Map();
for (const d of designers) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}

const DIFF_KEY = { EXPERT: 'e', MASTER: 'm', ULTIMA: 'u' };

// wiki「譜面製作者不明」清单（tools/designer-unknown.json）：这些谱的署名是
// 玩笑名/化名，wiki 归为「制作者不明」。统一收进一个谱师条目，不再散成上百条杂名。
const UNKNOWN_WHO = '制作者不明';
const unknownPos = new Map();
const unknownFile = path.join(process.cwd(), 'tools', 'designer-unknown.json');
if (fs.existsSync(unknownFile)) {
  for (const item of JSON.parse(fs.readFileSync(unknownFile, 'utf8'))) {
    unknownPos.set(norm(item.title), new Set(item.diffs || []));
  }
}

const byTitle = {};
const whoSongs = new Map(); // who -> Set(norm title)
const rawCount = new Map(); // 解析不了的 raw -> Set(norm title)
const whoCharts = new Map();

for (const s of songs) {
  const t = norm(s.title);
  if (!t) continue;
  const entry = {};
  for (const c of s.charts || []) {
    const k = DIFF_KEY[String(c.difficulty || '').toUpperCase()];
    if (!k) continue;
    const raw = String(c.charter || '').trim();
    if (!raw) continue;
    let who = alias2who.get(norm(raw)) || '';
    if (!who) {
      const pos = unknownPos.get(t);
      if (pos && pos.has(k)) who = UNKNOWN_WHO;
    }
    entry[k] = who ? { who, raw } : { who: '', raw };
    if (who) {
      if (!whoSongs.has(who)) whoSongs.set(who, new Set());
      whoSongs.get(who).add(t);
      whoCharts.set(who, (whoCharts.get(who) || 0) + 1);
    } else if (raw) {
      if (!rawCount.has(raw)) rawCount.set(raw, new Set());
      rawCount.get(raw).add(t);
    }
  }
  if (Object.keys(entry).length) byTitle[t] = entry;
}

const designerList = designers
  .map((d) => ({
    name: d.name,
    id: d.id || '',
    charts: whoCharts.get(d.name) || 0,
    songs: (whoSongs.get(d.name) || new Set()).size,
    aliases: (d.aliases || []).length,
  }))
  .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));

// 「制作者不明」是伪谱师：上游 designers 里没有，按收到的谱现算
if (whoCharts.has(UNKNOWN_WHO)) {
  designerList.push({
    name: UNKNOWN_WHO,
    id: 'nd-unknown',
    charts: whoCharts.get(UNKNOWN_WHO) || 0,
    songs: (whoSongs.get(UNKNOWN_WHO) || new Set()).size,
    aliases: 0,
  });
  designerList.sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));
}

const loose = [...rawCount.entries()]
  .map(([name, set]) => ({ name, songs: set.size }))
  .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));

const payload = {
  generatedAt: (src.meta && src.meta.sources && src.meta.sources.songs && src.meta.sources.songs.updatedAt) || '',
  stats: {
    designers: designerList.length,
    songs: Object.keys(byTitle).length,
    looseNames: loose.length,
    unmappedCharts: (src.meta && src.meta.mappingStats && src.meta.mappingStats.unmappedCharts) || 0,
    collaborationCharts: (src.meta && src.meta.mappingStats && src.meta.mappingStats.collaborationCharts) || 0,
  },
  designers: designerList,
  loose,
  songs: byTitle,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');
const bytes = fs.statSync(OUT).size;
console.log('写入 ' + OUT);
console.log('谱师 ' + designerList.length + ' 位 · 曲目 ' + Object.keys(byTitle).length + ' 首 · 未归并名义 ' + loose.length + ' 个 · ' + (bytes / 1024).toFixed(0) + ' KB');
console.log('前 8 位：' + designerList.slice(0, 8).map((d) => d.name + '(' + d.songs + ')').join(' / '));
