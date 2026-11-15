import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'https://baobao-owo.github.io';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2500));

// 开 仅显示合作
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
const toggled = await page.evaluate(() => {
  const t = document.querySelector('#chuni-collab-toggle');
  if (t && !t.classList.contains('active')) t.click();
  return t ? t.classList.contains('active') : null;
});
await page.evaluate(() => document.querySelector('#chuni-designer-close')?.click());
await new Promise((r) => setTimeout(r, 400));

await page.evaluate(() => {
  const s = document.querySelector('#chuni-search-title');
  s.value = '夜のサーカス';
  s.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 800));
const res = await page.evaluate(() => ({
  collab: document.querySelector('#chuni-collab-toggle')?.classList.contains('active'),
  rows: Array.from(document.querySelectorAll('.chuni-row')).map((r) => ({
    t: r.querySelector('.chuni-row-title')?.textContent.trim(),
    tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
  })),
}));
console.log(JSON.stringify(res, null, 1));
await browser.close();
