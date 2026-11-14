import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PATH = process.env.SONG || '/chuni/きゅうくらりん-fce740/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1400, deviceScaleFactor: 2 });
await page.goto(BASE + PATH, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const secs = await page.$$('.chuni-section');
for (let i = 0; i < secs.length; i++) {
  const title = await secs[i].evaluate((el) => (el.querySelector('.chuni-section-title') || {}).textContent || '');
  if (/详细|定数变更履历/.test(title)) {
    const name = /定数/.test(title) ? 'song-history' : 'song-detail';
    await secs[i].screenshot({ path: `D:\\Deepseek work\\blog\\_shots\\${name}.png` });
    console.log('saved', name, title.trim());
  }
}
await browser.close();
