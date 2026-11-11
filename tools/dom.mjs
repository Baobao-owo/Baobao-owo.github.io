import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
const dom = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const out = [];
  let el = c;
  while (el && out.length < 4) {
    out.push({
      tag: el.tagName,
      id: el.id,
      cls: (el.className || '').toString(),
      style: (el.getAttribute('style') || '').slice(0, 160),
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    });
    el = el.parentElement;
  }
  return out;
});
console.log(JSON.stringify(dom, null, 2));
await browser.close();
