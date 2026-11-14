import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const pages = ['/chuni/狂命-034c22/', '/chuni/name-of-oath-e2b635/'];
for (const p of pages) {
  try {
    await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 800));
    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const bad = [];
      document.querySelectorAll('table, .chuni-toolbar, .chuni-confirm-list, .chuni-info-table').forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 2) bad.push({ tag: el.tagName, cls: el.className.slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth });
      });
      return { docScroll: doc.scrollWidth, win: window.innerWidth, bad };
    });
    console.log(p, JSON.stringify(info));
    const secs = await page.$$('.chuni-section');
    for (const s of secs.slice(0, 2)) {
      const t = await s.evaluate((el) => (el.querySelector('.chuni-section-title') || {}).textContent || '');
      if (/详细|称号/.test(t)) {
        await s.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-' + (t.includes('详细') ? 'detail' : 'titles') + '.png' });
        console.log('  shot', t.trim());
      }
    }
  } catch (e) {
    console.log('ERR', p, String(e).slice(0, 60));
  }
}
await browser.close();
