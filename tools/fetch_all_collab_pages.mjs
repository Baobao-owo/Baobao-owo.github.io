// 抓所有合作曲的 wiki 曲目页（用于解析「譜面作者」署名）
// 用法：node tools/fetch_all_collab_pages.mjs [--limit N]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIR = '_tmp/wiki/songpage';
fs.mkdirSync(DIR, { recursive: true });

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));

// wiki 上的真实页面名（从「合作」小节的行里拿）
const wikiTitles = new Map();
const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
for (const s of sections) {
  if (!/合作/.test(s.heading)) continue;
  for (const r of s.rows) if (!wikiTitles.has(norm(r.title))) wikiTitles.set(norm(r.title), r.title);
}
const siteByNorm = new Map();
for (const s of site.songs) siteByNorm.set(norm(s.title), s.title);

const limitIdx = process.argv.indexOf('--limit');
const limit = limitIdx > 0 ? Number(process.argv[limitIdx + 1]) : 0;

const targets = [];
for (const key of Object.keys(collab.songs)) {
  const siteTitle = siteByNorm.get(norm(key)) || key;
  const wikiTitle = wikiTitles.get(norm(key)) || siteTitle;
  targets.push({ key, wikiTitle });
}

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

let ok = 0;
let skip = 0;
let fail = 0;
let done = 0;
for (const t of targets) {
  if (limit && done >= limit) break;
  done++;
  const out = DIR + '/' + t.wikiTitle.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (fs.existsSync(out) && fs.statSync(out).size > 180000) {
    skip++;
    continue;
  }
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(t.wikiTitle), {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const html = await page.content();
    if (html.includes('譜面作者')) {
      fs.writeFileSync(out, html, 'utf8');
      ok++;
    } else {
      fail++;
      if (/ページが存在しません|有効なWikiName/.test(html)) console.log('  miss page:', t.wikiTitle);
    }
  } catch (e) {
    fail++;
    console.log('  fail:', t.wikiTitle, String(e).slice(0, 60));
  }
  if (done % 10 === 0) console.log('进度', done + '/' + targets.length, 'ok', ok, 'skip', skip, 'fail', fail);
  await new Promise((r) => setTimeout(r, 1500));
}

await browser.close();
console.log('完成 抓到', ok, '已有', skip, '失败', fail, '总计', targets.length);
