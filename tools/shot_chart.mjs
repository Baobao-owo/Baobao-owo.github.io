import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4000';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });

const url = BASE + '/categories/' + encodeURIComponent('谱面记录') + '/';
const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise((r) => setTimeout(r, 2500));
console.log('status', resp.status(), 'title', await page.title());
const info = await page.evaluate(() => ({
  cards: document.querySelectorAll('.map-card').length,
  chips: Array.from(document.querySelectorAll('.map-chip')).map((c) => c.textContent.trim()),
}));
console.log(JSON.stringify(info));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chart-page.png', fullPage: true });
await browser.close();
