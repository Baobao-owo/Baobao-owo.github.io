import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2000));

const info = await page.evaluate(() => {
  const rows = ['.chuni-levels', '.chuni-diff-top', '#chuni-designer-diff', '.chuni-toolbar-filters'];
  return rows.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const cs = getComputedStyle(el);
    return {
      sel,
      cls: el.className,
      sw: el.scrollWidth,
      cw: el.clientWidth,
      wrap: cs.flexWrap,
      display: cs.display,
      overflowX: cs.overflowX,
    };
  });
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
