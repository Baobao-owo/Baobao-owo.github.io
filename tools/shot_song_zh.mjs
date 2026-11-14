import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PATH = process.env.SONG || '/chuni/祈-我ら神祖と共に歩む者なり-6e004b/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1600, deviceScaleFactor: 2 });
await page.goto(BASE + PATH, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1000));

await page.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
});
await new Promise((r) => setTimeout(r, 500));

const info = await page.evaluate(() => {
  const tables = Array.from(document.querySelectorAll('details table'));
  return tables.map((t) => t.innerText.replace(/\n+/g, ' | ').slice(0, 200));
});
console.log('详情块里的表:', info.length);
info.forEach((s, i) => console.log('  #' + i + ' ' + s));

const el = await page.evaluateHandle(() => {
  const ts = document.querySelectorAll('details table');
  return ts.length ? ts[ts.length - 1] : null;
});
const handle = el.asElement();
if (handle) {
  await handle.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\song-zh-titles.png' });
  console.log('saved');
}
await browser.close();
