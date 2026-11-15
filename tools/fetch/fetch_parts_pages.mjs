// 抓「还没有分工表」的合作曲的 wiki 曲目页（用于后续解析时间段分工）
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

const parts = JSON.parse(fs.readFileSync('source/assets/data/collab-parts.json', 'utf8'));
const rows = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'));
const cl = rows.filter((r) => r.cl === 1).map((r) => r.t);
const missing = cl.filter((t) => !parts[norm(t)]);

// wiki 页面名映射（从谱师页「合作」小节整理过）
const wikiTitle = new Map();
try {
  const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
  for (const s of sections) {
    if (!/合作/.test(s.heading || '')) continue;
    for (const r of s.rows || []) if (!wikiTitle.has(norm(r.title))) wikiTitle.set(norm(r.title), r.title);
  }
} catch (e) {}

const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

let ok = 0, skip = 0, fail = 0;
for (let i = 0; i < missing.length; i++) {
  const title = missing[i];
  const wt = wikiTitle.get(norm(title)) || title;
  const out = DIR + '/' + wt.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (fs.existsSync(out) && fs.statSync(out).size > 80000) { skip++; continue; }
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(wt), { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 900));
    const html = await page.content();
    if (html.includes('譜面作者') || html.includes('担当')) {
      fs.writeFileSync(out, html, 'utf8');
      ok++;
    } else { fail++; }
  } catch (e) { fail++; }
  if ((i + 1) % 20 === 0) console.log(`进度 ${i + 1}/${missing.length} ok=${ok} skip=${skip} fail=${fail}`);
  await new Promise((r) => setTimeout(r, 1100));
}

await browser.close();
console.log(`完成 ok=${ok} skip=${skip} fail=${fail} 总=${missing.length}`);
