// 把「两人联名」的谱面在 chuni_designers.json 里也写成「A × B」，保持一致
import fs from 'node:fs';

const SEP = /\s*(?:&|＆|\bVS\b|\bvs\b|×|＋)\s*/;
const alias = JSON.parse(fs.readFileSync('source/_data/chuni_designer_alias.json', 'utf8').replace(/^\uFEFF/, ''));
const MAP_FILE = 'source/_data/chuni_designers.json';
const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8').replace(/^\uFEFF/, ''));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const LETTER = { basic: 'B', advanced: 'A', expert: 'E', master: 'M', ultima: 'U' };

let changed = 0;
for (const song of site.songs.concat(removed)) {
  const title = String(song.title).trim();
  for (const sh of song.sheets || []) {
    const raw = String(sh.designer || '').trim();
    if (!raw || !SEP.test(raw)) continue;
    const combined = alias[raw] || '';
    if (!combined || combined.indexOf(' × ') === -1) continue;
    const letter = LETTER[sh.difficulty];
    if (!letter) continue;
    if (!map[title]) map[title] = {};
    if (map[title][letter] !== combined) {
      map[title][letter] = combined;
      changed++;
    }
  }
}

fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 1) + '\n', 'utf8');
console.log('改成联名写法:', changed, '张谱');
