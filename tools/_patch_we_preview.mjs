import fs from 'node:fs';

const p = 'themes/argon/scripts/chuni-guide.js';
let t = fs.readFileSync(p, 'utf8');

// 预览键：WE 谱用 _5
const oldLoop = `      for (let si = 0; si < enriched.sheets.length; si++) {
        const manifestKey = musicId + '_' + si;`;
const newLoop = `      for (let si = 0; si < enriched.sheets.length; si++) {
        const chartIdx = /^【.*】$/.test(String(enriched.sheets[si].difficulty)) ? 5 : si;
        const manifestKey = musicId + '_' + chartIdx;`;
if (t.includes(oldLoop)) t = t.replace(oldLoop, newLoop);
else console.error('preview key loop miss');

// 本地文件回退也用 chartIdx
const oldLocal = `          const rel = 'assets/chuni/preview/' + musicId + '_' + si + exts[ei];`;
const newLocal = `          const rel = 'assets/chuni/preview/' + musicId + '_' + chartIdx + exts[ei];`;
if (t.includes(oldLocal)) t = t.replace(oldLocal, newLocal);
else console.error('local fallback miss');

fs.writeFileSync(p, t, 'utf8');
console.log('patched:', t.includes('chartIdx'));
