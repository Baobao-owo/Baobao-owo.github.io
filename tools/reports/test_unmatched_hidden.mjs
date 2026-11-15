import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:4321';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const result = {};

// 1) 什么都不选，搜 Title —— 应该能搜到
await page.type('#chuni-search-title', '雑魚');
await new Promise((r) => setTimeout(r, 700));
result.noDesigner = await page.evaluate(() => ({
  rows: document.querySelectorAll('.chuni-row').length,
  count: document.querySelector('#chuni-count')?.textContent || '',
  first: document.querySelector('.chuni-row-title')?.textContent.trim() || '',
}));

// 2) 清空搜索，开谱师筛选并选一位，再搜 Title —— 应该 0 条
await page.evaluate(() => {
  const el = document.querySelector('#chuni-search-title');
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.querySelector('#chuni-designer-grid .chuni-dz-chip').click());
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 500));
await page.type('#chuni-search-title', '雑魚');
await new Promise((r) => setTimeout(r, 700));
result.withDesigner = await page.evaluate(() => ({
  rows: document.querySelectorAll('.chuni-row').length,
  count: document.querySelector('#chuni-count')?.textContent || '',
  emptyShown: !document.querySelector('#chuni-empty')?.hidden,
  emptyText: document.querySelector('#chuni-empty')?.textContent.trim() || '',
}));

console.log(JSON.stringify(result, null, 1));
await browser.close();
