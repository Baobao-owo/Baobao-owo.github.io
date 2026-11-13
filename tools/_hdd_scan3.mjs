// 扫描 HDD Music.xml：记录 id→{title, we, disable}
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['D:/XVX/opt', 'D:/XVX/HDD/data'];
const map = {};

function walk(dir, depth) {
  if (depth > 6) return;
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
        if (map[id]) continue;
        const title = m[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        map[id] = {
          title,
          we: /<exType>2<\/exType>/.test(xml),
          disable: /<disableFlag>true<\/disableFlag>/.test(xml)
        };
      } catch (e) {}
    }
  }
}

for (const r of ROOTS) walk(r, 0);
const ids = Object.keys(map).map(Number);
console.log('总数', ids.length, '| WE', ids.filter((i) => i >= 8000).length, '| disable', ids.filter((i) => map[i].disable).length);
fs.writeFileSync('_tmp/hdd-music2.json', JSON.stringify(map), 'utf8');
const dis = ids.filter((i) => map[i].disable).slice(0, 10);
console.log('disable 样例:', dis.map((i) => i + ' ' + map[i].title).join(' | '));
