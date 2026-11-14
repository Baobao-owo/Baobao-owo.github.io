import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const layout = await page.evaluate(() => {
  const main = document.querySelector('.chuni-toolbar-main');
  const order = Array.from(main.children).map((c) => {
    const id = c.id || '';
    const txt = (c.textContent || '').trim().slice(0, 18);
    return (id ? '#' + id : '') + (txt ? ' [' + txt + ']' : '');
  });
  const sort = document.querySelector('#chuni-sort');
  const sortOrder = Array.from(sort.children).map((c) => (c.id || '') + (c.textContent || '').trim().slice(0, 10));
  const dirBox = document.querySelector('#chuni-dir').getBoundingClientRect();
  const countBox = document.querySelector('#chuni-count').getBoundingClientRect();
  const toggleBox = document.querySelector('#chuni-designer-toggle').getBoundingClientRect();
  const verBox = document.querySelector('#chuni-version').getBoundingClientRect();
  return { order, sortOrder, dirRight: Math.round(dirBox.right), countLeft: Math.round(countBox.left), toggleLeft: Math.round(toggleBox.left), verRight: Math.round(verBox.right) };
});
console.log(JSON.stringify(layout, null, 1));

const bar = await page.$('.chuni-toolbar');
if (bar) await bar.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-toolbar3.png' });
await browser.close();
