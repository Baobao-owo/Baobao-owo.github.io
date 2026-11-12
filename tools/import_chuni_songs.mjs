// 导入 CHUNITHM 曲目导览数据（来源：arcade-songs 公开数据集）
// 用法：node tools/import_chuni_songs.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA_URL = 'https://dp4p6x0xfi5o9.cloudfront.net/chunithm/data.json';
const IMG_BASE = 'https://dp4p6x0xfi5o9.cloudfront.net/chunithm/img/cover-m/';
const OUT = path.join(process.cwd(), 'source/_data/chuni.json');

// 数据集里部分日文名字是「UTF-8 被当成 Latin-1」的乱码，还原一下
function fixMojibake(s) {
  if (typeof s !== 'string' || !s) return s;
  if (!/[ÃÂãï¼ã¢â]/.test(s)) return s;
  try {
    const fixed = Buffer.from(s, 'latin1').toString('utf8');
    if (!fixed.includes('\uFFFD') && fixed.length && fixed !== s) return fixed;
  } catch (e) {}
  return s;
}

const localFile = path.join(process.cwd(), '_tmp/chunithm-data.json');
let raw;
if (fs.existsSync(localFile)) {
  raw = JSON.parse(fs.readFileSync(localFile, 'utf8'));
  console.log('用本地缓存的 data.json');
} else {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error('下载失败 ' + res.status);
  raw = await res.json();
}

const songs = [];
for (const s of raw.songs || []) {
  const sheets = (s.sheets || []).map((sh) => ({
    type: sh.type,
    difficulty: sh.difficulty,
    level: sh.level,
    internal: sh.internalLevel,
    internalValue: sh.internalLevelValue,
    designer: fixMojibake(sh.noteDesigner || ''),
    notes: sh.noteCounts || null,
    regions: sh.regions || null,
    special: !!sh.isSpecial
  }));
  songs.push({
    id: s.songId,
    title: fixMojibake(s.title),
    artist: fixMojibake(s.artist),
    category: s.category,
    version: s.version,
    bpm: s.bpm,
    release: s.releaseDate,
    cover: s.imageName ? IMG_BASE + s.imageName : '',
    sheets
  });
}

const out = {
  updated: new Date().toISOString().slice(0, 10),
  source: 'arcade-songs (zetaraku/arcade-songs)',
  categories: (raw.categories || []).map((c) => ({ key: c.category, label: fixMojibake(c.label || c.category) })),
  versions: (raw.versions || []).map((v) => ({ key: v.version, abbr: v.abbr, release: v.releaseDate })),
  difficulties: (raw.difficulties || []).map((d) => ({ key: d.difficulty, color: d.color })),
  songs
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), 'utf8');

const totalSheets = songs.reduce((n, s) => n + s.sheets.length, 0);
console.log('songs:', songs.length, 'sheets:', totalSheets, 'size:', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB');
console.log('sample:', JSON.stringify(songs[0]).slice(0, 300));
