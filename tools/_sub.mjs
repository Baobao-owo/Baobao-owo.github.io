import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 2000));
const sub = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('h6, p, div')).find(e => (e.textContent||'').includes('世上只有一种英雄主义'));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), text: el.textContent.trim() };
});
console.log(JSON.stringify(sub));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\sidebar-quote.png', fullPage: false });
await browser.close();
