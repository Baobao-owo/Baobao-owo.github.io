import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const OUT = 'D:\\Deepseek work\\blog\\_shots';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const before = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count')?.textContent || '',
  rows: document.querySelectorAll('.chuni-row').length,
  hasToggle: !!document.querySelector('#chuni-designer-toggle'),
  panelHidden: document.querySelector('#chuni-designer-panel')?.hidden,
  designerLoaded: (window.DESIGNERS === undefined) ? 'n/a' : 'set',
}));
console.log('before:', JSON.stringify(before));

// 打开谱师面板
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 800));
const opened = await page.evaluate(() => ({
  hidden: document.querySelector('#chuni-designer-panel').hidden,
  chips: document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip').length,
  loose: document.querySelectorAll('#chuni-designer-loose .chuni-dz-chip').length,
  firstThree: Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).slice(0, 3).map((b) => b.textContent),
}));
console.log('opened:', JSON.stringify(opened));
await page.screenshot({ path: `${OUT}\\designer-panel.png` });

// 选 MASTER + 第一位谱师
await page.evaluate(() => {
  document.querySelector('.chuni-diff-chip[data-diff="m"]').click();
});
await new Promise((r) => setTimeout(r, 300));
const firstName = await page.evaluate(() => {
  const b = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
  b.click();
  return b.getAttribute('data-who');
});
await new Promise((r) => setTimeout(r, 900));
const picked = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count')?.textContent || '',
  rows: document.querySelectorAll('.chuni-row').length,
  tags: Array.from(document.querySelectorAll('.chuni-row-tag-ds')).slice(0, 3).map((t) => t.textContent),
  toggleActive: document.querySelector('#chuni-designer-toggle').classList.contains('active'),
}));
console.log('picked', JSON.stringify(firstName), '=>', JSON.stringify(picked));
await page.screenshot({ path: `${OUT}\\designer-filtered.png` });

// 排序互斥：点「按版本稼动」，确认只剩它 active
await page.click('#chuni-sort .chuni-sort-btn[data-sort="version"]');
await new Promise((r) => setTimeout(r, 600));
const sortState = await page.evaluate(() => ({
  actives: Array.from(document.querySelectorAll('#chuni-sort .chuni-sort-btn.active')).map((b) => b.textContent),
  rows: document.querySelectorAll('.chuni-row').length,
}));
console.log('sort:', JSON.stringify(sortState));

console.log('errors:', JSON.stringify(errors.slice(0, 5)));
await browser.close();
