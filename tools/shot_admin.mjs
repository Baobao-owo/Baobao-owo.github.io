import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const fails = [];
page.on('requestfailed', (r) => fails.push(r.url().slice(0, 90)));
await page.goto('https://baobao-owo.github.io/admin/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));
const info = await page.evaluate(() => ({
  text: (document.body.innerText || '').replace(/\n+/g, ' | ').slice(0, 300),
  hasLogin: !!document.querySelector('[class*="login"], button'),
  title: document.title,
}));
console.log('admin text:', JSON.stringify(info.text));
console.log('request failures:', JSON.stringify(fails.slice(0, 5)));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\admin.png' });
await browser.close();
