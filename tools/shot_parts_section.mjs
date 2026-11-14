import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PATH = process.env.SONG || '/chuni/' + encodeURIComponent('玩具狂奏曲-終焉-5b7565') + '/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1200, deviceScaleFactor: 2 });
await page.goto(BASE + PATH, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));

const sec = await page.evaluateHandle(() => {
  const titles = Array.from(document.querySelectorAll('.chuni-section'));
  return titles.find((s) => (s.querySelector('.chuni-section-title') || {}).textContent === '合作分工') || null;
});
const el = sec.asElement();
if (!el) {
  console.log('没找到合作分工区块');
} else {
  await el.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\toy-parts.png' });
  console.log('saved');
}
await browser.close();
