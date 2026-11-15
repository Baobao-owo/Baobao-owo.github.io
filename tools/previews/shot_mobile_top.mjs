import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 1100, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\m-page-top.png', fullPage: false });

// 桌面端确认标签没被吃掉
await page.setViewport({ width: 1100, height: 900, deviceScaleFactor: 1 });
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
const labels = await page.evaluate(() =>
  Array.from(document.querySelectorAll('#chuni-version button')).map((b) => b.textContent.trim())
);
console.log('桌面端版本按钮:', JSON.stringify(labels));
await browser.close();
