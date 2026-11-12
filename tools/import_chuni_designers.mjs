// 从本地 music_master.json 提取每首歌各难度的谱师，生成 source/_data/chuni_designers.json
// 数据源：D:\Deepseek work\中二节奏\国服日服成绩融合\input\music_master.json
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:\\Deepseek work\\中二节奏\\国服日服成绩融合\\input\\music_master.json';
const OUT = path.join(process.cwd(), 'source/_data/chuni_designers.json');

if (!fs.existsSync(SRC)) {
  console.error('找不到 music_master.json:', SRC);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const LETTER = { 0: 'B', 1: 'A', 2: 'E', 3: 'M', 4: 'U' };

const out = {};
for (const key of Object.keys(raw.songs || {})) {
  const s = raw.songs[key];
  if (!s || !s.title) continue;
  const row = {};
  for (const f of s.fumens || []) {
    const letter = LETTER[f.type] || (f.type_name ? f.type_name.charAt(0) : '');
    if (!letter || !f.designer) continue;
    if (f.enable === false) continue;
    row[letter] = String(f.designer).trim();
  }
  if (Object.keys(row).length) {
    out[String(s.title).trim()] = row;
  }
}

fs.writeFileSync(OUT, JSON.stringify(out), 'utf8');
console.log('曲目数:', Object.keys(out).length, '| 文件', (fs.statSync(OUT).size / 1024).toFixed(0), 'KB');
const sampleKey = Object.keys(out)[0];
console.log('示例:', sampleKey, JSON.stringify(out[sampleKey]));
