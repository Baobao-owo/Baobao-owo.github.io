// 扫描本地 CHUNITHM 游戏数据（option/A300）→ _tmp/game/music.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/XVX/HDD/bin/option/A300/music';
const OUT = '_tmp/game/music.json';

function firstStr(block) {
  const m = block.match(/<str>([\s\S]*?)<\/str>/);
  return m ? m[1].trim() : '';
}
function field(xml, name) {
  const m = xml.match(new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>'));
  return m ? firstStr(m[1]) : '';
}
function blocks(xml, name) {
  const out = [];
  const re = new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>', 'g');
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}
function numField(block, name) {
  const m = block.match(new RegExp('<' + name + '>(\\d+)</' + name + '>'));
  return m ? Number(m[1]) : null;
}

const dirs = fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const songs = [];
for (const d of dirs) {
  const file = path.join(ROOT, d, 'Music.xml');
  if (!fs.existsSync(file)) continue;
  const xml = fs.readFileSync(file, 'utf8');
  const sheets = [];
  for (const b of blocks(xml, 'MusicFumenData')) {
    const type = field(b, 'type');
    const data = (b.match(/<type>[\s\S]*?<data>([^<]*)<\/data>[\s\S]*?<\/type>/) || [])[1] || '';
    const diff = (data || type || '').toUpperCase();
    const lv = numField(b, 'level');
    const dec = numField(b, 'levelDecimal');
    const designer = (b.match(/<notesDesigner>([^<]*)<\/notesDesigner>/) || [])[1] || '';
    sheets.push({ diff, level: lv, levelDecimal: dec, designer: designer.trim() });
  }
  const jacket = (xml.match(/<jaketFile>[\s\S]*?<path>([^<]*)<\/path>/) || [])[1] || '';
  songs.push({
    dir: d,
    title: field(xml, 'name'),
    sortName: field(xml, 'sortName'),
    artist: field(xml, 'artistName'),
    genre: (xml.match(/<genreNames>[\s\S]*?<str>([^<]*)<\/str>/) || [])[1] || '',
    releaseTag: field(xml, 'releaseTagName'),
    jacket,
    sheets,
  });
}

fs.mkdirSync('_tmp/game', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(songs, null, 1), 'utf8');
console.log('songs:', songs.length);
console.log(JSON.stringify(songs[0], null, 1).slice(0, 500));
