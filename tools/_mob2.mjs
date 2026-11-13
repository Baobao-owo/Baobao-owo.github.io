import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2, hasTouch: true });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 2000));
const before = await page.evaluate(() => ({
  drawer: !!document.querySelector('.mnav-drawer'),
  links: Array.from(document.querySelectorAll('.mnav-links a')).map(a => a.textContent + ' -> ' + a.getAttribute('href')),
}));
await page.evaluate(() => document.querySelector('.navbar-toggler').click());
await new Promise(r => setTimeout(r, 700));
const opened = await page.evaluate(() => document.body.classList.contains('mnav-open'));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\mobile-drawer.png', fullPage: false });
console.log(JSON.stringify({ before, opened }, null, 1));
await browser.close();
