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
const chips = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).slice(0, 3).map((c) => c.textContent.trim())
);
console.log('first chips:', JSON.stringify(chips));

await page.type('#chuni-designer-q', 'ぴちネコ');
await new Promise((r) => setTimeout(r, 500));
const afterSearch = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).map((c) => c.textContent.trim())
);
console.log('search result chips:', JSON.stringify(afterSearch.slice(0, 3)));

await page.evaluate(() => {
  const chip = Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).find((c) => c.textContent.includes('ぴちネコ'));
  chip.click();
});
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => {
  const s = document.querySelector('#chuni-search-title');
  s.value = 'X7124';
  s.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 800));
const info = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count').textContent,
  rows: Array.from(document.querySelectorAll('.chuni-row')).map((r) => r.querySelector('.chuni-row-title')?.textContent.trim()),
}));
console.log(JSON.stringify(info));
await browser.close();
