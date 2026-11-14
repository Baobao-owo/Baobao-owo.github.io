import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 900, deviceScaleFactor: 2 });
await page.goto(BASE + encodeURI('/categories/中二节奏/'), { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const card = await page.$('.chuni-landing');
if (card) {
  const info = await page.evaluate(() => {
    const t = document.querySelector('.chuni-landing-title')?.textContent.trim();
    const d = document.querySelector('.chuni-landing-desc')?.innerText.replace(/\s+/g, ' ').trim();
    return { title: t, desc: d, hasStats: !!document.querySelector('.chuni-landing-stats') };
  });
  console.log(JSON.stringify(info, null, 1));
  await card.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-landing.png' });
  console.log('saved');
} else {
  console.log('landing 卡片没找到');
}
await browser.close();
