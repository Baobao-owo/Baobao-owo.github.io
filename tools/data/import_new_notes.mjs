// 从 wiki 曲目页的「詳細」表里抓物量（総数 / Tap / Hold / Slide / Air / Flick）
// 抓不到就跳过（新曲 wiki 可能还没更新）
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

function cells(rowHtml) {
  return [...rowHtml.matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((m) =>
    String(m[0])
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

const titles = process.argv.slice(2);
const siteFile = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
const byT = new Map(site.songs.map((s) => [norm(s.title), s]));

const DIFF_ORDER = ['basic', 'advanced', 'expert', 'master', 'ultima'];
let updated = 0;

for (const t of titles) {
  const f = '_tmp/wiki/songpage/' + t.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (!fs.existsSync(f)) {
    console.log('缺页面:', t);
    continue;
  }
  const html = fs.readFileSync(f, 'utf8');
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  let rows = null;
  for (const tb of tables) {
    const trs = [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => cells(m[0]));
    // 表头可能拆成两行：Lv|総数|内訳 / Tap|Hold|Slide|Air|Flick
    const flatHead = trs.slice(0, 2).map((r) => r.join(' ')).join(' ');
    if (!/Tap/.test(flatHead) || !/総数/.test(flatHead)) continue;
    const data = trs.filter((r) => r.length >= 6 && /^\d+\+?$/.test(r[0]));
    if (data.length) {
      rows = data;
      break;
    }
  }
  const s = byT.get(norm(t));
  if (!s) {
    console.log('站内没这首:', t);
    continue;
  }
  if (!rows || !rows.length) {
    console.log('无物量表（wiki 还没写）:', t);
    continue;
  }
  const sheets = s.sheets.filter((sh) => DIFF_ORDER.indexOf(sh.difficulty) >= 0);
  sheets.sort((a, b) => DIFF_ORDER.indexOf(a.difficulty) - DIFF_ORDER.indexOf(b.difficulty));
  let n = 0;
  rows.forEach((r, i) => {
    const sh = sheets[i];
    if (!sh) return;
    const [lv, total, tap, hold, slide, air, flick] = r;
    sh.notes = {
      tap: Number(tap) || 0,
      hold: Number(hold) || 0,
      slide: Number(slide) || 0,
      air: Number(air) || 0,
      flick: Number(flick) || 0,
      total: Number(total) || 0,
    };
    n++;
  });
  if (n) {
    updated++;
    console.log('补物量:', t, '→', n, '张谱');
  }
}

fs.writeFileSync(siteFile, JSON.stringify(site), 'utf8');
console.log('更新曲目:', updated);
