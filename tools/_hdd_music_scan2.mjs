// 扫描 HDD 里所有 Music.xml（opt 与 HDD/data 都扫），生成 id→曲名
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['D:/XVX/opt', 'D:/XVX/HDD/data'];
const map = {};

function walk(dir, depth) {
  if (depth > 5) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'sound' || e.name === 'dds') continue;
      walk(p, depth + 1);
    } else if (e.name.toLowerCase() === 'music.xml') {
      try {
        const xml = fs.readFileSync(p, 'utf8');
        const m = xml.match(/<name>\s*<id>(\d+)<\/id>\s*<str>([^<]*)<\/str>/);
        if (!m) continue;
        const id = Number(m[1]);
        const title = m[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        if (!map[id]) map[id] = { title, we: /<exType>2<\/exType>/.test(xml), file: p };
      } catch (e) {}
    }
  }
}

for (const r of ROOTS) walk(r, 0);
const ids = Object.keys(map).map(Number);
console.log('Music.xml 总数:', ids.length, '| WE(8xxx):', ids.filter((i) => i >= 8000).length);
fs.writeFileSync('_tmp/hdd-music.json', JSON.stringify(map), 'utf8');
