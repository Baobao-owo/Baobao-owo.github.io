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

await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 600));

// 搜「ロシェ」，选第一位
await page.type('#chuni-designer-q', 'ロシェ');
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const b = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
  b.click();
});
// 收面板，方便看列表
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 800));

// 找《創造》那一行
const info = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.chuni-row'));
  const hit = rows.find((r) => r.textContent.includes('Cries, beyond The End'));
  if (!hit) return { found: false };
  hit.scrollIntoView({ block: 'center' });
  const badges = Array.from(hit.querySelectorAll('.chuni-row-badges .chuni-badge')).map((b) => b.textContent.trim());
  return {
    found: true,
    title: hit.querySelector('.chuni-row-title')?.textContent.trim(),
    badges,
  };
});
console.log('row:', JSON.stringify(info));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}\\designer-badge-only.png` });

console.log('errors:', JSON.stringify(errors.slice(0, 4)));
await browser.close();
