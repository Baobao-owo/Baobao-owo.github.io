// 扫描新版本包（A093 / AKOP）里的曲目
// Music.xml 结构：<tag><id>..</id><str>值</str><data /></tag>
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'D:/QQ/Downloads/option (1)';
const PACKS = ['A093', 'AKOP'];

function block(raw, tag) {
  const m = raw.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1] : '';
}
// 取块里的 <str>，没有就退化成去标签文本
function value(blk) {
  const s = blk.match(/<str>([\s\S]*?)<\/str>/);
  if (s) return s[1].trim();
  const n = blk.match(/<(?:i32|id)>([\s\S]*?)<\/(?:i32|id)>/);
  if (n) return n[1].trim();
  return blk.replace(/<[^>]*>/g, '').trim();
}
const pick = (raw, tag) => value(block(raw, tag));

const out = [];
for (const pack of PACKS) {
  const musicDir = path.join(BASE, pack, 'music');
  if (!fs.existsSync(musicDir)) continue;
  for (const dir of fs.readdirSync(musicDir)) {
    const p = path.join(musicDir, dir);
    if (!fs.statSync(p).isDirectory()) continue;
    const xmlFile = path.join(p, 'Music.xml');
    if (!fs.existsSync(xmlFile)) continue;
    const raw = fs.readFileSync(xmlFile, 'utf8');

    const genreBlock = block(raw, 'genreNames');
    const genres = [...genreBlock.matchAll(/<str>([\s\S]*?)<\/str>/g)].map((m) => m[1].trim());

    const fumens = [...raw.matchAll(/<MusicFumenData>([\s\S]*?)<\/MusicFumenData>/g)].map((m) => {
      const b = m[1];
      const f = (t) => value(block(b, t));
      return {
        type: f('type'),
        level: f('level'),
        levelDecimal: f('levelDecimal'),
        notesDesigner: f('notesDesigner'),
        defaultBpm: f('defaultBpm'),
        enable: f('enable'),
      };
    });

    out.push({
      pack,
      dir,
      id: pick(raw, 'name') ? dir.replace(/\D/g, '') : dir.replace(/\D/g, ''),
      title: pick(raw, 'name'),
      artist: pick(raw, 'artistName'),
      genre: genres[0] || '',
      releaseTag: pick(raw, 'releaseTagName'),
      bpm: (function () { const m = [...raw.matchAll(/<defaultBpm>([\s\S]*?)<\/defaultBpm>/g)].map((x) => x[1].trim()).filter((x) => x && x !== '0'); return m[0] || ''; })(),
      fumens,
      hasCover: fs.existsSync(path.join(p, 'CHU_UI_Jacket_' + dir.replace(/\D/g, '') + '.dds')),
      coverFile: 'CHU_UI_Jacket_' + dir.replace(/\D/g, '') + '.dds',
    });
  }
}

fs.writeFileSync('_tmp/new-pack-songs.json', JSON.stringify(out, null, 1), 'utf8');
console.log('新包里曲目:', out.length);
for (const s of out) {
  console.log('  [' + s.pack + '] ' + s.id + '  「' + s.title + '」 / ' + s.artist + '  bpm=' + s.bpm + '  tag=' + s.releaseTag + '  genre=' + s.genre + '  封面=' + (s.hasCover ? '有' : '无'));
  s.fumens.forEach((f) => {
    if (String(f.enable).toLowerCase() === 'false') return;
    console.log('      ' + f.type + '  Lv' + f.level + '.' + f.levelDecimal + '  ND=' + (f.notesDesigner || '-'));
  });
}
