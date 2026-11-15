import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 700, height: 900, deviceScaleFactor: 1 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2000));

const sizes = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      w: Math.round(r.width),
      h: Math.round(r.height),
      pad: cs.padding,
      fs: cs.fontSize,
      br: cs.borderRadius,
      border: cs.borderWidth,
    };
  };
  return [
    pick('#chuni-version button'),
    pick('#chuni-cat'),
    pick('#chuni-designer-toggle'),
    pick('#chuni-sort button[data-sort="version"]'),
    pick('#chuni-sort button[data-sort="title"]'),
    pick('#chuni-dir'),
  ];
});
console.log(JSON.stringify(sizes, null, 1));
const sort = await page.$('#chuni-sort');
const dir = await page.$('#chuni-dir');
const main = await page.$('.chuni-toolbar-main');
const boxes = await page.evaluate(() => {
  const b = (s) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top) };
  };
  return { sort: b('#chuni-sort'), dir: b('#chuni-dir'), count: b('#chuni-count'), main: b('.chuni-toolbar-main') };
});
console.log(JSON.stringify(boxes));
await browser.close();
