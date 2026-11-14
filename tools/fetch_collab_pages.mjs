import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const titles = process.argv.slice(2);
if (!titles.length) {
  console.error('usage: node fetch_collab_pages.mjs <title> [...]');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

for (const t of titles) {
  const url = 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(t);
  const out = '_tmp/wiki/songpage/' + t.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  fs.mkdirSync('_tmp/wiki/songpage', { recursive: true });
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const html = await page.content();
    fs.writeFileSync(out, html, 'utf8');
    console.log('saved', t, html.length);
  } catch (e) {
    console.log('FAIL', t, String(e).slice(0, 80));
  }
  await new Promise((r) => setTimeout(r, 2000));
}
await browser.close();
