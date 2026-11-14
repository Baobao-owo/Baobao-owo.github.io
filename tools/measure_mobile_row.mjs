import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2000));

const info = await page.evaluate(() => {
  const row = document.querySelector('.chuni-row');
  const kids = Array.from(row.children).map((c) => {
    const r = c.getBoundingClientRect();
    return { cls: c.className, w: Math.round(r.width), left: Math.round(r.left), h: Math.round(r.height), tag: c.tagName };
  });
  const r = row.getBoundingClientRect();
  return {
    row: { w: Math.round(r.width), h: Math.round(r.height), sw: row.scrollWidth, cw: row.clientWidth },
    kids,
    listSW: document.querySelector('.chuni-list').scrollWidth,
    listCW: document.querySelector('.chuni-list').clientWidth,
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
