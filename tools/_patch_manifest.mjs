import fs from 'node:fs';

const p = 'themes/argon/scripts/chuni-guide.js';
let t = fs.readFileSync(p, 'utf8');

const anchor = "  const idMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_ids) || {};";
if (!t.includes('previewMap')) {
  t = t.replace(anchor, anchor + "\n  const previewMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_previews) || {};");
}

const oldLoop = `    if (musicId) {
      for (let si = 0; si < enriched.sheets.length; si++) {
        const exts = ['.webp', '.png', '.svg'];`;
const newLoop = `    if (musicId) {
      for (let si = 0; si < enriched.sheets.length; si++) {
        const manifestKey = musicId + '_' + si;
        if (previewMap[manifestKey]) {
          previews[si] = previewMap[manifestKey];
          continue;
        }
        const exts = ['.webp', '.png', '.svg'];`;

if (!t.includes('manifestKey')) {
  if (!t.includes(oldLoop)) {
    console.error('找不到 previews 循环');
    process.exit(1);
  }
  t = t.replace(oldLoop, newLoop);
}

fs.writeFileSync(p, t, 'utf8');
console.log('generator uses manifest:', t.includes('previewMap[manifestKey]'));
