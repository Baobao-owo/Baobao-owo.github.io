// 从已抓取的 wiki 曲目页把「曲目信息 / 由来 / 物量」补进站点数据
// 用法: node tools/import_song_wiki.mjs "站内曲名"
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const title = process.argv[2];
if (!title) {
  console.error('用法: node tools/import_song_wiki.mjs "曲名"');
  process.exit(1);
}

// 站内曲名 → wiki 页面名
const index = JSON.parse(fs.readFileSync('_tmp/wiki/page-index.json', 'utf8'));
let page = null;
for (const [text, p] of Object.entries(index)) {
  if (norm(text) === norm(title) || norm(p) === norm(title)) {
    page = p;
    break;
  }
}
if (!page) {
  for (const [text, p] of Object.entries(index)) {
    const a = norm(text);
    const b = norm(title);
    if (a.includes(b) || b.includes(a)) {
      page = p;
      break;
    }
  }
}
if (!page) {
  console.log('wiki 索引里找不到:', title);
  process.exit(1);
}

const file = '_tmp/wiki/songpage/' + page.replace(/[\\/:*?"<>|]/g, '_') + '.html';
if (!fs.existsSync(file)) {
  console.log('页面还没抓:', page, '→', file);
  process.exit(1);
}
const html = fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');

function tables() {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
}
function rowsOf(tb) {
  return [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
  );
}

// ---- 曲目信息 ----
const info = {};
let noteRows = null;
for (const tb of tables()) {
  const rows = rowsOf(tb);
  if (!rows.length) continue;
  const head = rows[0].join(' ');
  if (/ジャンル/.test(head) || rows.some((r) => r[0] === 'ジャンル')) {
    for (const r of rows) {
      if (r.length >= 2 && r[0] && r[1]) info[r[0]] = r[1];
    }
  }
  if (/総数/.test(head) && /Tap/.test(rows[1] ? rows[1].join(' ') : '')) {
    noteRows = rows.filter((r) => /^\d+\+?$/.test(r[0]));
  }
}

// ---- 由来 ----
const text = txt(html);
let origins = [];
const oi = text.indexOf('ND名義・称号の由来');
if (oi >= 0) {
  let seg = text.slice(oi, oi + 1200);
  // 砍到下一个大标题
  const cuts = ['攻略など', '音源', 'コメント'].map((k) => seg.indexOf(k)).filter((n) => n > 20);
  if (cuts.length) seg = seg.slice(0, Math.min.apply(null, cuts));
  seg = seg.replace(/^ND名義・称号の由来\s*/, '');
  // 以「ND名義」或「称号」开头的句子切成条目
  const parts = seg.split(/(?=(?:ND名義|称号[「『]))/).map((x) => x.trim()).filter(Boolean);
  origins = parts.length ? parts : [seg.trim()];
}

// ---- 物量 ----
const DIFFS = ['basic', 'advanced', 'expert', 'master', 'ultima'];
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const song = site.songs.find((s) => norm(s.title) === norm(title));
let filledNotes = 0;
if (song && noteRows) {
  const sheets = song.sheets.filter((sh) => DIFFS.indexOf(sh.difficulty) >= 0);
  sheets.sort((a, b) => DIFFS.indexOf(a.difficulty) - DIFFS.indexOf(b.difficulty));
  noteRows.forEach((r, i) => {
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
    filledNotes++;
  });
  fs.writeFileSync('source/_data/chuni.json', JSON.stringify(site), 'utf8');
}

// ---- 写入 chuni_extra ----
const EX = 'source/_data/chuni_extra.json';
const extra = JSON.parse(fs.readFileSync(EX, 'utf8'));
const key = Object.keys(extra).find((k) => norm(k) === norm(title)) || title;
const cur = extra[key] || {};
const next = Object.assign({}, cur);
next.wiki_title = page;
next.wiki_info = Object.assign({}, cur.wiki_info || {});
if (info['ジャンル']) next.wiki_info['ジャンル'] = info['ジャンル'];
if (info['タイトル']) next.wiki_info['タイトル'] = info['タイトル'];
if (info['アーティスト']) next.wiki_info['アーティスト'] = info['アーティスト'];
if (info['BPM']) next.wiki_info['BPM'] = info['BPM'];
if (info['解禁方法']) next.wiki_info['解禁方法'] = info['解禁方法'];
if (origins.length) next.origins = origins;
extra[key] = next;
fs.writeFileSync(EX, JSON.stringify(extra), 'utf8');

console.log('wiki 页面:', page);
console.log('曲目信息:', JSON.stringify(next.wiki_info).slice(0, 240));
console.log('由来条目:', origins.length);
origins.slice(0, 4).forEach((o) => console.log('  -', o.slice(0, 120)));
console.log('物量补充:', filledNotes, '张谱');
