import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 500));
await page.type('#chuni-designer-q', 'ぴちネコ');
await new Promise((r) => setTimeout(r, 400));
const picked = await page.evaluate(() => {
  const chip = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
  chip.click();
  return chip.textContent.trim();
});
await new Promise((r) => setTimeout(r, 500));
// 只显示单独
await page.evaluate(() => document.querySelector('#chuni-solo-toggle')?.click());
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  const s = document.querySelector('#chuni-search-title');
  s.value = 'X7124';
  s.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
const rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.chuni-row')).map((r) => r.querySelector('.chuni-row-title')?.textContent.trim())
);
console.log('picked:', picked);
console.log('rows:', JSON.stringify(rows));
await browser.close();
