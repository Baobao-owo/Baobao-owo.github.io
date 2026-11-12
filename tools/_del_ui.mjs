import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:4000/chuni/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 2500));
const base = await page.evaluate(() => (document.getElementById('chuni-count')||{}).textContent);
await page.evaluate(() => document.getElementById('chuni-removed').click());
await new Promise(r => setTimeout(r, 900));
const del = await page.evaluate(() => ({
  count: (document.getElementById('chuni-count')||{}).textContent,
  rows: Array.from(document.querySelectorAll('.chuni-row')).slice(0,4).map(r => r.querySelector('.chuni-row-title').textContent.trim()),
}));
await page.evaluate(() => document.getElementById('chuni-we').click());
await new Promise(r => setTimeout(r, 900));
const weAfter = await page.evaluate(() => ({
  count: (document.getElementById('chuni-count')||{}).textContent,
  remActive: document.getElementById('chuni-removed').classList.contains('active'),
  weActive: document.getElementById('chuni-we').classList.contains('active'),
}));
console.log(JSON.stringify({ base, del, weAfter }, null, 1));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-del-mode.png', fullPage: false });
await browser.close();
