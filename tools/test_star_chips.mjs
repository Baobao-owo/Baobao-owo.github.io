import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1000, deviceScaleFactor: 2 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));

const before = await page.evaluate(() => ({
  chips: Array.from(document.querySelectorAll('#chuni-levels button')).slice(0, 6).map((b) => b.textContent.trim()),
}));

// 打开 WORLD'S END
await page.click('#chuni-we');
await new Promise((r) => setTimeout(r, 700));
const afterWe = await page.evaluate(() => ({
  chips: Array.from(document.querySelectorAll('#chuni-levels button')).map((b) => b.textContent.trim()),
  classes: document.querySelector('#chuni-levels').className,
  count: document.querySelector('#chuni-count').textContent,
}));

// 点「3 星」
await page.evaluate(() => {
  const b = document.querySelector('#chuni-levels button[data-star="3"]');
  if (b) b.click();
});
await new Promise((r) => setTimeout(r, 600));
const star3 = await page.evaluate(() => ({
  count: document.querySelector('#chuni-count').textContent,
  active: Array.from(document.querySelectorAll('#chuni-levels button.active')).map((b) => b.textContent.trim()),
}));

const el = await page.$('.chuni-levels');
if (el) await el.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-stars.png' });

console.log('before:', JSON.stringify(before));
console.log('afterWe:', JSON.stringify(afterWe));
console.log('star3:', JSON.stringify(star3));
await browser.close();
