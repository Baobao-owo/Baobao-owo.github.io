import fs from 'node:fs';
const f = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(f, 'utf8'));
const s = site.songs.find((x) => x.title === '狂命');
if (!s) {
  console.log('没找到');
  process.exit(1);
}
for (const sh of s.sheets) {
  if (sh.difficulty === 'master') {
    sh.level = '15+';
    sh.internal = '15.2';
    sh.internalValue = 15.2;
  }
}
fs.writeFileSync(f, JSON.stringify(site), 'utf8');
console.log('狂命 MASTER =>', s.sheets.find((x) => x.difficulty === 'master'));
