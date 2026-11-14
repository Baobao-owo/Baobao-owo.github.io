import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 700, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const bar = await page.$('.chuni-toolbar');
if (!bar) {
  console.log('no toolbar');
} else {
  await bar.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-toolbar-narrow.png' });
  console.log('saved');
}
await browser.close();
