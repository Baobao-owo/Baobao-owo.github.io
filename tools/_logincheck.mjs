import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto('https://baobao-owo.github.io/admin/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 8000));
const btn = await page.evaluateHandle(() => {
  const nodes = Array.from(document.querySelectorAll('button, a'));
  return nodes.find(n => (n.innerText || '').trim() === '登录') || null;
});
if (btn.asElement()) {
  await btn.asElement().click();
  await new Promise(r => setTimeout(r, 4000));
  console.log('URL:', page.url().slice(0, 300));
  console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g,' | ').slice(0,200));
} else { console.log('no login button'); }
await page.screenshot({ path: 'D:\\\\Deepseek work\\\\blog\\\\_shots\\\\admin-login.png' });
await browser.close();
