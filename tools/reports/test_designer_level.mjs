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

// 选谱师：ロシェ
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 500));
await page.type('#chuni-designer-q', 'ロシェ');
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => document.querySelector('#chuni-designer-grid .chuni-dz-chip').click());
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 500));

// 点定数 15
const clicked = await page.evaluate(() => {
  const chip = Array.from(document.querySelectorAll('.chuni-lv-chip')).find((b) => b.getAttribute('data-level') === '15');
  if (!chip) return false;
  chip.click();
  return true;
});
await new Promise((r) => setTimeout(r, 800));

const report = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.chuni-row'));
  const empties = [];
  const shown = [];
  rows.forEach((r) => {
    const badges = Array.from(r.querySelectorAll('.chuni-row-badges .chuni-badge')).map((b) => b.textContent.trim());
    const real = badges.filter((b) => b && b !== '—');
    if (!real.length) empties.push(r.querySelector('.chuni-row-title')?.textContent.trim());
    else shown.push(r.querySelector('.chuni-row-sub')?.textContent.trim() + ' → ' + real.join(','));
  });
  return {
    count: document.querySelector('#chuni-count')?.textContent || '',
    totalRows: rows.length,
    empties: empties.slice(0, 10),
    emptyCount: empties.length,
    sample: shown.slice(0, 5),
  };
});
console.log('clicked 15:', clicked);
console.log('report:', JSON.stringify(report, null, 1));
await page.screenshot({ path: `${OUT}\\designer-level15.png` });
console.log('errors:', JSON.stringify(errors.slice(0, 4)));
await browser.close();
