import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2, hasTouch: true });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 2000));
const info = await page.evaluate(() => {
  const b = document.querySelector('#banner');
  const nav = document.querySelector('#navbar, nav.navbar, .navbar');
  return {
    banner: b ? getComputedStyle(b).display + ' h=' + b.getBoundingClientRect().height : 'none',
    nav: nav ? getComputedStyle(nav).display + ' h=' + nav.getBoundingClientRect().height : 'none',
    bodyW: document.body.clientWidth,
  };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\mobile-before.png', fullPage: false });
await browser.close();
