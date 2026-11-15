import fs from 'node:fs';
import path from 'node:path';

// 日服：本体 + 所有 option 包（新曲经常只在 A0xx 包里，光扫 A000/A300 会漏）
const MATE = 'D:/SDHD - CHUNITHM Mate/HDD';
const XVX = 'D:/XVX/HDD';
const OPTION_PACKS = ['A001', 'A071', 'A072', 'A073', 'A074', 'A081', 'A091', 'A092', 'A093', 'A300', 'AKOP'];
const roots = [['mate', MATE + '/data/A000/music']];
for (const pack of OPTION_PACKS) roots.push(['mate_' + pack.toLowerCase(), MATE + '/bin/option/' + pack + '/music']);
roots.push(['xvx', XVX + '/data/A000/music']);
for (const pack of ['A300', 'A301', 'A302']) roots.push(['xvx_' + pack.toLowerCase(), XVX + '/bin/option/' + pack + '/music']);

const decode = (x) => String(x || '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (x) => decode(String(x || '').replace(/<[^>]+>/g, '')).trim();

function parseMusicXML(xml) {
  const id = Number(strip((xml.match(/<dataName>\s*music(\d+)\s*<\/dataName>/) || [])[1] || 0)) || null;
  const name = strip((xml.match(/<name>\s*<id>[^<]*<\/id>\s*<str>([\s\S]*?)<\/str>/) || [])[1] || '');
  const releaseTag = strip((xml.match(/<releaseTagName>[\s\S]*?<str>([\s\S]*?)<\/str>/) || [])[1] || '');
  const releaseId = Number(strip((xml.match(/<releaseTagName>[\s\S]*?<id>([\s\S]*?)<\/id>/) || [])[1] || -1)) || -1;
  const artist = strip((xml.match(/<artistName>\s*<id>[^<]*<\/id>\s*<str>([\s\S]*?)<\/str>/) || [])[1] || '');
  const genre = strip((xml.match(/<genreNames>[\s\S]*?<str>([\s\S]*?)<\/str>/) || [])[1] || '');
  const releaseDate = strip((xml.match(/<releaseDate>([\s\S]*?)<\/releaseDate>/) || [])[1] || '');
  const weAttr = strip((xml.match(/<worldsEndTagName>[\s\S]*?<str>([\s\S]*?)<\/str>/) || [])[1] || '');
  const weStarsRaw = Number(strip((xml.match(/<starDifType>([\s\S]*?)<\/starDifType>/) || [])[1] || 0)) || 0;
  // starDifType 是 1/3/5/7/9，对应 ☆1~☆5
  const weStars = weStarsRaw ? Math.ceil(weStarsRaw / 2) : 0;
  const sheets = [];
  const re = /<MusicFumenData>([\s\S]*?)<\/MusicFumenData>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const type = strip((block.match(/<type>[\s\S]*?<str>([\s\S]*?)<\/str>/) || [])[1] || '');
    const level = Number(strip((block.match(/<level>([\s\S]*?)<\/level>/) || [])[1] || 0)) || 0;
    const dec = Number(strip((block.match(/<levelDecimal>([\s\S]*?)<\/levelDecimal>/) || [])[1] || 0)) || 0;
    const enable = strip((block.match(/<enable>([\s\S]*?)<\/enable>/) || [])[1] || 'false') === 'true';
    const designer = strip((block.match(/<notesDesigner>([\s\S]*?)<\/notesDesigner>/) || [])[1] || '');
    if (!type) continue;
    sheets.push({ type, level, dec, enable, designer, const: level + dec / 100 });
  }
  return { id, name, artist, genre, releaseDate, releaseTag, releaseId, weAttr, weStars, sheets };
}

const result = {};
for (const [tag, dir] of roots) {
  result[tag] = {};
  if (!fs.existsSync(dir)) { console.log('missing', tag, dir); continue; }
  const dirs = fs.readdirSync(dir).filter(d => /^music\d+$/.test(d));
  for (const d of dirs) {
    const xmlPath = path.join(dir, d, 'Music.xml');
    if (!fs.existsSync(xmlPath)) continue;
    try {
      const parsed = parseMusicXML(fs.readFileSync(xmlPath, 'utf8'));
      if (parsed.id != null) result[tag][parsed.id] = parsed;
    } catch (e) { /* skip */ }
  }
  console.log(tag, dirs.length, 'dirs', Object.keys(result[tag]).length, 'parsed');
}
fs.mkdirSync('_tmp/game', { recursive: true });
fs.writeFileSync('_tmp/game/music-xml.json', JSON.stringify(result), 'utf8');
console.log('saved _tmp/game/music-xml.json', (fs.statSync('_tmp/game/music-xml.json').size / 1024 / 1024).toFixed(2), 'MB');
