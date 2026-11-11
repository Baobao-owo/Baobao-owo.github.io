import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4000';
const OUT = 'D:\\Deepseek work\\blog\\_shots';
const pages = [
  ['level1-home', '/'],
  ['level2-board', '/categories/' + encodeURIComponent('谱面记录') + '/'],
  ['level3-child', '/categories/' + encodeURIComponent('谱面记录') + '/' + encodeURIComponent('4k下落式') + '/'],
  ['level2-list', '/categories/' + encodeURIComponent('杂谈') + '/'],
];

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

for (const [name, path] of pages) {
  const resp = await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  const info = await page.evaluate(() => ({
    boards: document.querySelectorAll('.board-card').length,
    children: document.querySelectorAll('.child-card').length,
    maps: document.querySelectorAll('.map-card').length,
    previews: document.querySelectorAll('.post-preview, article.post').length,
  }));
  console.log(name, resp.status(), JSON.stringify(info));
  await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: true });
}
await browser.close();
