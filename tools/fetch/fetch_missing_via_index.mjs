// 用索引把漏抓的曲目页找回来并抓取
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIR = '_tmp/wiki/songpage';
const squash = (s) => String(s || '').normalize('NFKC').replace(/[\s\u3000]+/g, '').toLowerCase();

const misses = JSON.parse(fs.readFileSync('_tmp/wiki/collab-misses.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('_tmp/wiki/page-index.json', 'utf8'));

const bySquash = new Map();
for (const [text, page] of Object.entries(index)) {
  bySquash.set(squash(text), { text, page });
  bySquash.set(squash(page), { text, page });
}

const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

let ok = 0;
for (const title of misses) {
  const hit = bySquash.get(squash(title));
  if (!hit) {
    console.log('  索引里没有:', title);
    continue;
  }
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(hit.page), {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const html = await page.content();
    if (!html.includes('譜面作者')) {
      console.log('  无署名行:', title, '→', hit.page);
      continue;
    }
    fs.writeFileSync(DIR + '/' + hit.page.replace(/[\\/:*?"<>|]/g, '_') + '.html', html, 'utf8');
    ok++;
    console.log('  ok:', title, '→', hit.page);
  } catch (e) {
    console.log('  失败:', title, String(e).slice(0, 60));
  }
  await new Promise((r) => setTimeout(r, 1200));
}

console.log('补抓成功:', ok, '/', misses.length);
await browser.close();
