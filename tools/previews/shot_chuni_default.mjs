import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const info = await page.evaluate(() => {
  const sortBtns = Array.from(document.querySelectorAll('#chuni-sort button')).map((b) => ({
    t: b.textContent.trim(),
    active: b.classList.contains('active'),
  }));
  return {
    count: document.querySelector('#chuni-count').textContent,
    sortBtns,
    hideRemoved: document.querySelector('#chuni-hide-removed').classList.contains('active'),
    firstRows: Array.from(document.querySelectorAll('.chuni-row')).slice(0, 3).map((r) => ({
      t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 30),
      v: r.querySelector('.chuni-row-meta')?.textContent.trim().slice(0, 24) || '',
    })),
  };
});
console.log(JSON.stringify(info, null, 1));

const bar = await page.$('.chuni-toolbar');
if (bar) await bar.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-default.png' });
await browser.close();
