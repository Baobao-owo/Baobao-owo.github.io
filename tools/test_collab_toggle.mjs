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

await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// 选谱师 じゃこレモン
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
await page.type('#chuni-designer-q', 'じゃこレモン');
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => document.querySelector('#chuni-designer-grid .chuni-dz-chip').click());
await new Promise((r) => setTimeout(r, 600));

const before = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count')?.textContent || '',
  rows: document.querySelectorAll('.chuni-row').length,
  collabActive: document.querySelector('#chuni-collab-toggle').classList.contains('active'),
}));

// 搜「LibrariA」，看合作关着时有没有
await page.type('#chuni-search-title', 'LibrariA');
await new Promise((r) => setTimeout(r, 700));
const collabOff = await page.evaluate(() => ({
  rows: document.querySelectorAll('.chuni-row').length,
  count: document.querySelector('#chuni-count')?.textContent || '',
}));

// 打开合作
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await new Promise((r) => setTimeout(r, 700));
const collabOn = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.chuni-row'));
  return {
    rows: rows.length,
    count: document.querySelector('#chuni-count')?.textContent || '',
    tags: rows.slice(0, 3).map((r) => r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || ''),
    badges: rows.slice(0, 3).map((r) => Array.from(r.querySelectorAll('.chuni-row-badges .chuni-badge')).map((b) => b.textContent.trim()).join('|')),
  };
});

// 清搜索，看总量
await page.evaluate(() => {
  const el = document.querySelector('#chuni-search-title');
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 700));
const totals = await page.evaluate(() => document.querySelector('#chuni-count')?.textContent || '');

console.log('before:', JSON.stringify(before));
console.log('collab off:', JSON.stringify(collabOff));
console.log('collab on:', JSON.stringify(collabOn));
console.log('total with collab:', totals);
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}\\collab-on.png` });
console.log('errors:', JSON.stringify(errors.slice(0, 4)));
await browser.close();
