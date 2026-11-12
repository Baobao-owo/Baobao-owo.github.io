// 从 B 站谱面确认合集的分P里，给每首歌匹配「曲名 + 难度 → 视频链接」
// 用法: node tools/import_chuni_confirm.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ROOT_DATA = path.join(ROOT, 'source/_data');
const guide = JSON.parse(fs.readFileSync(path.join(ROOT_DATA, 'chuni.json'), 'utf8'));
const uploads = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/bili_uploads.json'), 'utf8')).list;
const OUT = path.join(ROOT_DATA, 'chuni_confirm.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const VERSION_PATTERNS = [
  ['Mate', 'Mate'],
  ['X-VERSE-X', 'X-VERSE-X'],
  ['X-VERSE', 'X-VERSE'],
  ['VERSE', 'VERSE'],
  ['LUMINOUS Plus', 'LUMINOUS PLUS'],
  ['LUMINOUS', 'LUMINOUS'],
  ['SUN Plus', 'SUN PLUS'],
  ['SUN', 'SUN'],
  ['NEW PLUS!!', 'CHUNITHM NEW PLUS'],
  ['NEW!!', 'CHUNITHM NEW'],
  ['Paradise Lost', 'PARADISE LOST'],
  ['Paradise', 'PARADISE'],
  ['Crystal Plus', 'CRYSTAL PLUS'],
  ['Crystal', 'CRYSTAL'],
  ['Amazon Plus', 'AMAZON PLUS'],
  ['Amazon', 'AMAZON'],
  ['AIR Plus', 'AIR PLUS'],
  ['AIR', 'AIR'],
  ['STAR Plus', 'STAR PLUS'],
  ['STAR', 'STAR'],
  ['初代', 'CHUNITHM'],
  ['Plus', 'CHUNITHM PLUS']
];

function versionOf(title) {
  for (const [pat, ver] of VERSION_PATTERNS) {
    if (title.includes(pat)) return ver;
  }
  return '';
}

const videos = uploads
  .filter((v) => v.title.includes('谱面确认') && v.title.includes('Chunithm'))
  .map((v) => ({ ...v, version: versionOf(v.title) }))
  .filter((v) => v.version);

console.log('版本合集:', videos.map((v) => v.version + '=' + v.bv).join(', '));

// 曲名归一化
function norm(s) {
  return String(s)
    .normalize('NFKC')
    .replace(/[\[\]【】()（）「」『』]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const songIndex = new Map();
for (const s of guide.songs) {
  const k = norm(s.title);
  if (!songIndex.has(k)) songIndex.set(k, s);
}

const DIFF = { MASTER: 'M', ULTIMA: 'U', EXPERT: 'E', ADVANCED: 'A', BASIC: 'B' };

async function pagelist(bv) {
  for (let tries = 0; tries < 4; tries++) {
    try {
      const res = await fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${bv}&jsonp=jsonp`, {
        headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' }
      });
      const j = await res.json();
      if (j.code === 0) return j.data || [];
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 2500 * (tries + 1)));
  }
  return [];
}

const out = {};
let matched = 0;
let unmatched = 0;

for (const v of videos) {
  const parts = await pagelist(v.bv);
  console.log(v.version, v.bv, '分P:', parts.length);
  for (const p of parts) {
    const m = String(p.part || '').match(/^(.*?)\s*\[([A-Z]+)/);
    if (!m) continue;
    const title = m[1].trim();
    const diff = DIFF[m[2]] || '';
    const song = songIndex.get(norm(title));
    if (!song || !diff) {
      unmatched++;
      continue;
    }
    const url = `https://www.bilibili.com/video/${v.bv}?p=${p.page}`;
    out[song.title] = out[song.title] || {};
    out[song.title][diff] = url;
    matched++;
  }
  await new Promise((r) => setTimeout(r, 1200));
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log('匹配成功', matched, '条，未匹配', unmatched, '| 覆盖曲目', Object.keys(out).length);
const sample = Object.keys(out)[0];
if (sample) console.log('示例:', sample, JSON.stringify(out[sample]));
