// 把 chuni_designers.json 里的「团队名义 / 制作者不明」换成游戏内实际署名的原始字符串
import fs from 'node:fs';

const PLACEHOLDERS = new Set(['团队名义', '制作者不明']);

const p = 'source/_data/chuni_designers.json';
const map = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8').replace(/^\uFEFF/, ''));
const c2s = JSON.parse(fs.readFileSync('_tmp/game/c2s-designers-all.json', 'utf8'));

const KEY = { B: 0, A: 1, E: 2, M: 3, U: 4, W: 5 };
const byTitle = new Map(site.songs.map((s) => [String(s.title).trim(), s]));
const LETTER = { basic: 'B', advanced: 'A', expert: 'E', master: 'M', ultima: 'U' };

let fixed = 0;
const missing = [];

for (const [title, rec] of Object.entries(map)) {
  for (const [k, v] of Object.entries(rec)) {
    if (!PLACEHOLDERS.has(v)) continue;
    const song = byTitle.get(title);
    let raw = '';

    const id = ids[title];
    if (id !== undefined && KEY[k] !== undefined) raw = c2s[String(Number(id)) + '_' + KEY[k]] || '';

    if (!raw && song) {
      const letter = { B: 'basic', A: 'advanced', E: 'expert', M: 'master', U: 'ultima', W: "world's end" }[k];
      const sh = (song.sheets || []).find((x) => x.difficulty === letter || (k === 'W' && /^【/.test(x.difficulty)));
      if (sh && sh.designer && !PLACEHOLDERS.has(sh.designer)) raw = sh.designer;
    }

    if (raw && !PLACEHOLDERS.has(raw)) {
      rec[k] = raw;
      fixed++;
    } else {
      missing.push(title + '|' + k);
    }
  }
}

fs.writeFileSync(p, JSON.stringify(map, null, 1) + '\n', 'utf8');
console.log('替换占位名义:', fixed, '| 仍找不到原始署名:', missing.length);
missing.slice(0, 10).forEach((m) => console.log('  ' + m));
