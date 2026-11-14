// 解析已抓取的 wiki 曲目页：抽「譜面作者【EXP…X、MAS…Y vs Z】」
// 输出：_tmp/wiki/song-credits.json
import fs from 'node:fs';

function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const DIR = '_tmp/wiki/songpage';
const OUT = '_tmp/wiki/song-credits.json';
const out = {};
let miss = 0;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const text = txt(fs.readFileSync(DIR + '/' + f, 'utf8'));
  const m = text.match(/譜面作者【([^】]+)】/);
  if (!m) {
    miss++;
    continue;
  }
  const parts = {};
  for (const seg of m[1].split(/[、,]/)) {
    const mm = seg.match(/^\s*(EXP|MAS|ULT|ADV|BAS|EXPERT|MASTER|ULTIMA)\s*[…\.:：]+\s*(.+)$/i);
    if (!mm) continue;
    const k = mm[1].toUpperCase();
    const key = k.startsWith('EXP') ? 'e' : k.startsWith('MAS') ? 'm' : k.startsWith('ULT') ? 'u' : k.startsWith('ADV') ? 'a' : 'b';
    if (!parts[key]) parts[key] = mm[2].trim();
  }
  if (Object.keys(parts).length) out[f.replace(/\.html$/, '')] = parts;
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log('解析到署名行:', Object.keys(out).length, ' 没有署名行:', miss);
