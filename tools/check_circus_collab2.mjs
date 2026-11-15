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

await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 600));

const state1 = await page.evaluate(() => {
  const t = document.querySelector('#chuni-collab-toggle');
  t.click();
  return { found: !!t, active: t.classList.contains('active') };
});
await new Promise((r) => setTimeout(r, 800));

const state2 = await page.evaluate(() => {
  const t = document.querySelector('#chuni-collab-toggle');
  const s = document.querySelector('#chuni-search-title');
  s.value = '夜のサーカス';
  s.dispatchEvent(new Event('input', { bubbles: true }));
  return { collabActive: t.classList.contains('active'), count: document.querySelector('#chuni-count').textContent };
});
await new Promise((r) => setTimeout(r, 800));

const rows = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.chuni-row')).map((r) => ({
    t: r.querySelector('.chuni-row-title')?.textContent.trim(),
    tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
  }))
);
console.log(JSON.stringify({ state1, state2, rows }, null, 1));
await browser.close();
