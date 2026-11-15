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
console.log('before:', await page.evaluate(() => document.querySelector('#chuni-count').textContent));

await page.evaluate(() => {
  const chip = Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).find((c) => c.textContent.includes('ぴちネコ'));
  chip.click();
});
await new Promise((r) => setTimeout(r, 700));
const s1 = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count').textContent,
  active: Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip.active')).map((c) => c.textContent.trim()),
  rows: document.querySelectorAll('.chuni-row').length,
}));
console.log('after chip:', JSON.stringify(s1));
await browser.close();
