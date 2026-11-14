// 用 .c2s 的 CREATOR 补全「站内没有谱师」的难度（主要是 BASIC/ADVANCED）
// 输出：source/_data/chuni_designer_fill.json  { "<曲名>": { "B": "...", "A": "..." } }
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8').replace(/^\uFEFF/, ''));
const c2s = JSON.parse(fs.readFileSync('_tmp/game/c2s-designers-all.json', 'utf8'));

const LETTER = { basic: 'B', advanced: 'A', expert: 'E', master: 'M', ultima: 'U' };
const IDX = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4 };

// 用户确认的别名映射（CREATOR 里出现的写法 → 实际谱师）
const EXTRA_ALIAS = JSON.parse(fs.readFileSync('tools/designer-alias-extra.json', 'utf8').replace(/^\uFEFF/, ''));
const FIX = {};
for (const [alias, who] of Object.entries(EXTRA_ALIAS)) FIX[alias.toLowerCase()] = who;

const fill = {};
let count = 0;

for (const s of data.songs) {
  const id = ids[String(s.title).trim()];
  if (id === undefined) continue;
  for (const sh of s.sheets || []) {
    const cur = String(sh.designer || '').trim();
    if (cur && cur !== '-') continue;
    const idx = IDX[sh.difficulty];
    if (idx === undefined) continue;
    const v = c2s[String(Number(id)) + '_' + idx];
    if (!v) continue;
    const letter = LETTER[sh.difficulty];
    if (!fill[s.title]) fill[s.title] = {};
    fill[s.title][letter] = FIX[String(v).toLowerCase()] || v;
    count++;
  }
}

fs.writeFileSync('source/_data/chuni_designer_fill.json', JSON.stringify(fill, null, 0), 'utf8');
console.log('补全谱师:', count, '张谱，涉及曲目:', Object.keys(fill).length);
