// 解析全部版本的「楽曲一覧(追加日順)」，合成一张全曲顺序表
// 输出：tools/song-addorder.json  { "<曲名>": { "date": "YYYY-MM-DD", "order": N, "version": "..." } }
import fs from 'node:fs';
import path from 'node:path';

const DIR = '_tmp/wiki/addorder';
function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const LEVEL = /^(\d{1,2}\+?|ULTIMA|WE|【.*】)$/i;
const GENRE = /^(P&A|VAR|ORI|東方|niconico|ゲキマイ|イロドリ|POPS)/i;

const out = {};
let pages = 0;
let rows = 0;

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const version = f.replace(/ 楽曲一覧.*$/, '').replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const tb = tables.find((t) => t.includes('タイトル'));
  if (!tb) {
    console.log('  无表格:', version);
    continue;
  }
  const trs = [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
  );
  pages++;
  let date = '';
  let order = 0;
  for (const r of trs) {
    const joined = r.join(' ');
    const dm = joined.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (dm && /追加配信曲/.test(joined)) {
      date = dm[1] + '-' + String(dm[2]).padStart(2, '0') + '-' + String(dm[3]).padStart(2, '0');
      order = 0;
      continue;
    }
    if (r.length < 4) continue;
    const tail = r.slice(-4);
    if (!tail.every((c) => LEVEL.test(c))) continue;
    let title = '';
    for (const c of r) {
      if (LEVEL.test(c)) continue;
      if (GENRE.test(c) && c.length <= 4) continue;
      title = c;
      break;
    }
    if (!title || !date) continue;
    order++;
    rows++;
    if (out[title]) continue;
    out[title] = { date, order, version };
  }
}

fs.writeFileSync('tools/song-addorder.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('页面:', pages, ' 曲目行:', rows, ' 收录曲:', Object.keys(out).length);
const byVer = {};
for (const v of Object.values(out)) byVer[v.version] = (byVer[v.version] || 0) + 1;
console.log(JSON.stringify(byVer, null, 1));
