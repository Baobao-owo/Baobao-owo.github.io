// 从 CHUNITHM HDD 的 Music.xml 抽 id→曲名（WE 的 8xxx 编号）
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['D:/XVX/opt'];
const map = {};

function walk(dir, depth) {
  if (depth > 4) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name.toLowerCase() === 'music.xml') {
      try {
        const xml = fs.readFileSync(p, 'utf8');
        const idm = xml.match(/<name>\s*<id>(\d+)<\/id>\s*<str>([^<]*)<\/str>/);
        if (!idm) continue;
        const id = Number(idm[1]);
        const title = idm[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const we = /<exType>2<\/exType>/.test(xml);
        map[id] = { title, we };
      } catch (err) {}
    }
  }
}

for (const r of ROOTS) walk(r, 0);
const ids = Object.keys(map).map(Number);
console.log('解析 Music.xml:', ids.length, '| 8xxx:', ids.filter((i) => i >= 8000).length);
fs.writeFileSync('_tmp/hdd-music.json', JSON.stringify(map), 'utf8');
const we = Object.entries(map).filter(([i, v]) => Number(i) >= 8000);
console.log('WE 样例:', we.slice(0, 5).map(([i, v]) => i + ' ' + v.title).join(' | '));
