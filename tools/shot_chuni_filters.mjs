import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const filters = await page.$('.chuni-toolbar-filters');
await filters.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-filters.png' });

const counts = await page.evaluate(async () => {
  const read = () => document.querySelector('#chuni-count').textContent;
  const out = { initial: read() };
  document.querySelector('#chuni-hide-removed').click();
  await new Promise((r) => setTimeout(r, 400));
  out.hideRemoved = read();
  document.querySelector('#chuni-removed').click();
  await new Promise((r) => setTimeout(r, 400));
  out.onlyRemoved = read();
  document.querySelector('#chuni-hide-removed').click();
  await new Promise((r) => setTimeout(r, 400));
  out.both = read();
  return out;
});
console.log(JSON.stringify(counts));
await browser.close();
