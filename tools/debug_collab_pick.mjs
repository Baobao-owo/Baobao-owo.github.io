import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'https://baobao-owo.github.io';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 150)));
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// 开面板 + 开「仅显示合作」
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await new Promise((r) => setTimeout(r, 300));

// 选ミストルティン
await page.type('#chuni-designer-q', 'ミストルティン');
await new Promise((r) => setTimeout(r, 400));
const chipInfo = await page.evaluate(() => {
  const chips = Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).slice(0, 3).map((b) => b.getAttribute('data-who'));
  const first = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
  if (first) first.click();
  return chips;
});
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 600));

const state = await page.evaluate(() => ({
  toggleLabel: document.querySelector('#chuni-designer-toggle')?.textContent.trim(),
  collabActive: document.querySelector('#chuni-collab-toggle')?.classList.contains('active'),
  count: document.querySelector('#chuni-count')?.textContent || '',
}));

await page.evaluate(() => {
  const el = document.querySelector('#chuni-search-title');
  el.value = 'PRAGMATISM';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
const rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.chuni-row')).map((r) => r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 50))
);

console.log('chips:', JSON.stringify(chipInfo));
console.log('state:', JSON.stringify(state));
console.log('rows:', JSON.stringify(rows));
console.log('errors:', JSON.stringify(errs.slice(0, 3)));
await browser.close();
