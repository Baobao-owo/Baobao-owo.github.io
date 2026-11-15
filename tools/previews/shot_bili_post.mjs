import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PATH = '/2026/10/08/tuiqiu-act2-notes/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1200, deviceScaleFactor: 2 });
await page.goto(BASE + PATH, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const info = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('.post-content img'));
  return {
    title: document.querySelector('h1')?.textContent.trim(),
    h2: Array.from(document.querySelectorAll('.post-content h2')).map((h) => h.textContent.trim()).slice(0, 8),
    imgs: imgs.length,
    broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
    firstImg: imgs[0]?.getAttribute('src'),
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\bili-post.png', fullPage: false });
await browser.close();
