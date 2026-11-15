// 把增量包里的新曲写进 source/_data/chuni_new_songs.json（曲绘 DDS 转 webp）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ITEMS = JSON.parse(fs.readFileSync('_tmp/build/new-songs.json', 'utf8'));
const IDS_FILE = 'source/_data/chuni_ids.json';
const OUT = 'source/_data/chuni_new_songs.json';
const IMG_DIR = 'source/assets/img/chuni-new';
const C2S = JSON.parse(fs.readFileSync('_tmp/game/c2s-designers-all.json', 'utf8'));

const CAT = {
  'POPS & ANIME': 'POPS & ANIME',
  'niconico': 'niconico',
  '東方Project': '東方Project',
  VARIETY: 'VARIETY',
  ORIGINAL: 'ORIGINAL',
  'ゲキマイ': 'ゲキマイ',
  'イロドリミドリ': 'イロドリミドリ',
};
const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

const DIFF_IDX = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4 };
const INDEX = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8')).songs.map((s) => String(s.title).trim());
const IDS = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8').replace(/^\uFEFF/, ''));

const songs = [];
const added = [];

for (const it of ITEMS) {
  const title = decode(it.title).trim();
  if (!title || INDEX.includes(title)) continue; // 站内已有
  const dir = path.dirname(it.path);
  const dds = fs.readdirSync(dir).filter((f) => /\.dds$/i.test(f))[0] || '';
  let cover = '';
  if (dds) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const h = crypto.createHash('md5').update(title).digest('hex').slice(0, 10);
    cover = `/assets/img/chuni-new/${h}.webp`;
    added.push({ dds: path.join(dir, dds), out: path.join(IMG_DIR, h + '.webp'), title });
  }
  const mid = String(Number(it.id));
  const sheets = it.sheets.map((sh) => ({
    type: 'std',
    difficulty: sh.difficulty,
    level: sh.level,
    internalValue: sh.internalValue,
    designer: C2S[mid + '_' + DIFF_IDX[sh.difficulty]] || sh.designer || '',
  }));
  songs.push({
    id: mid,
    title,
    artist: decode(it.artist),
    category: CAT[decode(it.genre)] || 'ORIGINAL',
    genre: decode(it.genre),
    version: 'Mate',
    bpm: 0,
    release: '',
    cover,
    sheets,
    newFrom: decode(it.version),
  });
  IDS[title] = Number(mid);
}

fs.writeFileSync(OUT, JSON.stringify(songs, null, 1) + '\n', 'utf8');
fs.writeFileSync(IDS_FILE, JSON.stringify(IDS, null, 0) + '\n', 'utf8');
fs.writeFileSync('_tmp/build/new-song-covers.json', JSON.stringify(added, null, 1), 'utf8');
console.log('新增曲目:', songs.length);
songs.forEach((s) => console.log('-', s.id, s.title, '|', s.category, '|', s.sheets.map((x) => x.difficulty + x.level).join(',')));
console.log('待转曲绘:', added.length);
