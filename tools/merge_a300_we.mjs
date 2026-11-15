// 把 Mate 的 A300 数据包里的 WE 谱面并入 chuni_we，并输出决策清单
// 用法：node tools/merge_a300_we.mjs [--write]
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const xml = JSON.parse(fs.readFileSync('_tmp/game/music-xml.json', 'utf8'));
const creators = JSON.parse(fs.readFileSync('_tmp/build/c2s-creators.json', 'utf8'));
const wePath = 'source/_data/chuni_we.json';
const delPath = 'source/_data/chuni_we_deleted.json';
const we = JSON.parse(fs.readFileSync(wePath, 'utf8'));
const del = JSON.parse(fs.readFileSync(delPath, 'utf8'));

if (!we.songs) we.songs = {};
if (!del.songs) del.songs = [];

const norm = (t) => String(t).normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const weByNorm = new Map(Object.keys(we.songs).map((t) => [norm(t), t]));
const delByNorm = new Map(del.songs.map((s) => [norm(s.title), s]));

const rows = [];
for (const v of Object.values(xml.mate_a300 || {})) {
  const sheet = (v.sheets || []).find((s) => s.type === 'WorldsEnd' && s.enable);
  if (!sheet) continue;
  const key = String(v.id);
  const designer = (creators[key] && creators[key].ultima) || '';
  const n = norm(v.name);
  const curTitle = weByNorm.get(n);
  const delEntry = delByNorm.get(n);
  const cur = curTitle ? we.songs[curTitle] : null;
  let action = 'skip';
  let conflict = '';
  if (cur) {
    if (designer && cur.designer && cur.designer !== designer) {
      conflict = `designer 站内「${cur.designer}」/ A300「${designer}」`;
      action = 'conflict';
    } else if (designer && !cur.designer) {
      action = 'fill-designer';
    } else {
      action = 'exists';
    }
  } else {
    action = 'add';
  }
  rows.push({
    id: v.id,
    title: v.name,
    genre: v.genre,
    releaseTag: v.releaseTag,
    designer,
    attr: (delEntry && delEntry.attr) || (cur && cur.attr) || '',
    stars: (cur && cur.stars) || '',
    inWe: !!cur,
    inDeleted: !!delEntry,
    action,
    conflict,
  });
}

const counts = rows.reduce((m, r) => ((m[r.action] = (m[r.action] || 0) + 1), m), {});
const gaps = rows.filter((r) => !r.attr || !r.stars);

if (WRITE) {
  for (const r of rows) {
    if (!(r.action === 'add' || r.action === 'fill-designer')) continue;
    const t = r.title;
    const prev = we.songs[t] || {};
    we.songs[t] = {
      attr: prev.attr || r.attr || '',
      stars: prev.stars || null,
      designer: prev.designer || r.designer || '',
      from: prev.from || 'A300',
    };
  }
  we.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(wePath, JSON.stringify(we), 'utf8');
}

fs.mkdirSync('_tmp/reports', { recursive: true });
const head = ['action', 'id', 'title', 'designer', 'attr', 'stars', 'inWe', 'inDeleted', 'conflict'];
const tsv = [head.join('\t')]
  .concat(rows.map((r) => head.map((k) => String(r[k] ?? '').replace(/\t/g, ' ')).join('\t')))
  .join('\n');
fs.writeFileSync('_tmp/reports/a300-we-merge.tsv', tsv, 'utf8');

console.log('A300 WE 条目', rows.length);
console.log('动作', JSON.stringify(counts));
console.log('缺 attr/stars', gaps.length);
console.log('写回', WRITE ? '是' : '否（加 --write）');
