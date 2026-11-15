import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const shots = [];
const toolbar = await page.$('.chuni-toolbar');
if (toolbar) {
  await toolbar.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-toolbar.png' });
  shots.push('m-toolbar');
}
const levels = await page.$('.chuni-levels');
if (levels) {
  await levels.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-levels.png' });
  shots.push('m-levels');
}
const list = await page.$('#chuni-list');
if (list) {
  await page.evaluate(() => window.scrollTo(0, 600));
  await new Promise((r) => setTimeout(r, 400));
  const first = await page.$('.chuni-row');
  if (first) {
    await first.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-row.png' });
    shots.push('m-row');
  }
}
// 谱师面板
await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('#chuni-designer-toggle').click(); });
await new Promise((r) => setTimeout(r, 600));
const panel = await page.$('#chuni-designer-panel');
if (panel) {
  await panel.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-panel.png' });
  shots.push('m-panel');
}
const overflow = await page.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.chuni-toolbar, .chuni-levels, .chuni-list, .chuni-designer-panel').forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 2) bad.push({ cls: el.className, sw: el.scrollWidth, cw: el.clientWidth });
  });
  return { docScroll: document.documentElement.scrollWidth, win: window.innerWidth, bad };
});
console.log(JSON.stringify({ shots, overflow }, null, 1));
await browser.close();
