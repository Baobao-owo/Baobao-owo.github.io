import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
// 找一个有「谱面确认」的曲目页
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1200, deviceScaleFactor: 2 });

const dirs = ['010-ea20a0', '1-c4ca42'];
let ok = false;
for (const d of dirs) {
  try {
    await page.goto(BASE + '/chuni/' + encodeURIComponent(d) + '/', { waitUntil: 'networkidle2', timeout: 45000 });
    const has = await page.evaluate(() => !!document.querySelector('.chuni-confirm-list'));
    if (has) { ok = true; break; }
  } catch (e) {}
}
console.log('found confirm list:', ok);

const list = await page.$('.chuni-confirm-list');
if (list) {
  await list.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\confirm-rows.png' });
  const info = await page.evaluate(() => {
    const row = document.querySelector('.chuni-confirm-row');
    const name = row.querySelector('.chuni-confirm-name');
    const badge = name.querySelector('.chuni-badge');
    const nm = name.querySelectorAll('span')[1];
    const src = name.querySelector('.chuni-confirm-src');
    const r = (el) => Math.round(el.getBoundingClientRect().left);
    return { badge: r(badge), name: r(nm), src: r(src), width: Math.round(name.getBoundingClientRect().width) };
  });
  console.log(JSON.stringify(info));
}
await browser.close();
