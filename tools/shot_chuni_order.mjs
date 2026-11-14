import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.chuni-row')).slice(0, 10).map((r) => ({
    t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 34),
    meta: (r.querySelector('.chuni-row-sub, .chuni-row-meta')?.textContent || '').trim().slice(0, 40),
  }))
);
console.log(JSON.stringify(rows, null, 1));
await browser.close();
