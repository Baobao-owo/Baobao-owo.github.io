import fs from 'node:fs';
const f = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(f, 'utf8'));
const s = site.songs.find((x) => x.title === '狂命');
if (!s) {
  console.log('没找到 狂命');
  process.exit(1);
}
s.version = s.version || 'Mate';
s.bpm = s.bpm || 220;
s.release = s.release || '2026-10-29';
fs.writeFileSync(f, JSON.stringify(site), 'utf8');
console.log('狂命 =>', s.version, s.bpm, s.release);
const back = JSON.parse(fs.readFileSync(f, 'utf8')).songs.find((x) => x.title === '狂命');
console.log('回读:', back.version, back.bpm, back.release);
