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
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// 打开谱师面板 → 仅显示合作（不选谱师）
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 500));

// 勾定数 15，按定数倒序
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('.chuni-lv-chip')).find((x) => x.getAttribute('data-level') === '15');
  if (b) b.click();
});
await page.click('#chuni-sort .chuni-sort-btn[data-sort="const"]');
await new Promise((r) => setTimeout(r, 300));
const dirText = await page.evaluate(() => document.querySelector('#chuni-dir').textContent.trim());
if (dirText.indexOf('正序') !== -1) await page.click('#chuni-dir');
await new Promise((r) => setTimeout(r, 800));

const report = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.chuni-row')).slice(0, 6).map((r) => {
    const vals = Array.from(r.querySelectorAll('.chuni-row-badges .chuni-badge')).map((b) => b.textContent.trim()).filter((t) => t && t !== '—');
    return { t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 26), shown: vals.join(',') };
  });
  return { count: document.querySelector('#chuni-count')?.textContent || '', dir: document.querySelector('#chuni-dir').textContent.trim(), rows };
});
console.log(JSON.stringify(report, null, 1));
await page.screenshot({ path: `${OUT}\\collab-const-sort.png` });
console.log('errors:', JSON.stringify(errors.slice(0, 3)));
await browser.close();
