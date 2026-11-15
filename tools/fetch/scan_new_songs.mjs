// 从增量包的 Music.xml 里抽取新曲信息
import fs from 'node:fs';
import path from 'node:path';

const roots = process.argv.slice(2);
const out = [];

function field(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  const inner = m[1];
  const s = inner.match(/<str>([\s\S]*?)<\/str>/);
  return s ? s[1].trim() : inner.replace(/<[^>]+>/g, '').trim();
}

function all(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1]);
}

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'Music.xml') {
        const xml = fs.readFileSync(p, 'utf8');
        const fumen = all(xml, 'MusicFumenData');
        const sheets = [];
        for (const f of fumen) {
          const type = field(f, 'type').toUpperCase();
          const level = field(f, 'level');
          const dec = field(f, 'levelDecimal');
          const designer = field(f, 'notesDesigner');
          const enable = field(f, 'enable');
          if (!/BASIC|ADVANCED|EXPERT|MASTER|ULTIMA/i.test(type)) continue;
          const lv = Number(level);
          if (!lv) continue;
          sheets.push({ difficulty: type.toLowerCase(), level: String(lv), internalValue: dec ? lv + Number(dec) / 100 : lv, designer });
        }
        out.push({
          dir: path.relative(root, path.dirname(p)).replace(/\\/g, '/'),
          id: field(xml, 'name') || path.basename(path.dirname(p)),
          title: field(xml, 'name'),
          artist: field(xml, 'artistName'),
          genre: field(xml, 'genreNames'),
          bpm: field(xml, 'bpm') || '',
          version: field(xml, 'releaseTagName'),
          sheets,
          path: p,
        });
      }
    }
  })(root);
}

fs.writeFileSync('_tmp/build/new-songs.json', JSON.stringify(out, null, 1), 'utf8');
console.log('新曲:', out.length);
for (const s of out) {
  console.log(`- ${s.id} ${s.title} / ${s.artist} | ${s.genre} | ver ${s.version} | sheets ${s.sheets.map((x) => x.difficulty + x.level).join(',')}`);
}
