// 从 music_master.json 提取「曲名 → musicId」，给单曲页显示歌曲 ID
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:\\Deepseek work\\中二节奏\\国服日服成绩融合\\input\\music_master.json';
const OUT = path.join(process.cwd(), 'source/_data/chuni_ids.json');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const out = {};
for (const key of Object.keys(raw.songs || {})) {
  const s = raw.songs[key];
  if (!s || !s.title) continue;
  const id = s.id !== undefined && s.id !== null ? String(s.id) : String(key);
  const title = String(s.title).trim();
  if (!(title in out)) out[title] = id;
}

fs.writeFileSync(OUT, JSON.stringify(out), 'utf8');
console.log('曲名→ID:', Object.keys(out).length);
