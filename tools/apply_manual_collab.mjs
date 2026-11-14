// 把手填名单里的合作信息写进 collab.json
import fs from 'node:fs';

const manual = JSON.parse(fs.readFileSync('tools/designer-manual.json', 'utf8'));
const COLLAB = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(COLLAB, 'utf8'));

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
let n = 0;
for (const [title, entry] of Object.entries(manual.collab || {})) {
  const key = Object.keys(collab.songs).find((k) => norm(k) === norm(title)) || norm(title);
  collab.songs[key] = collab.songs[key] || {};
  for (const [diff, people] of Object.entries(entry)) {
    collab.songs[key][diff] = people;
    n++;
  }
}
fs.writeFileSync(COLLAB, JSON.stringify(collab, null, 0), 'utf8');
console.log('手填合作条目写入:', n, ' 合作曲:', Object.keys(collab.songs).length);
