import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.setViewport({ width: 1400, height: 1100 });
try {
  const res = await page.goto('https://space.bilibili.com/1311127373/upload/opus', {
    waitUntil: 'networkidle2',
    timeout: 90000
  });
  await new Promise((r) => setTimeout(r, 5000));
  const info = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('a[href*="/opus/"]').forEach((a) => {
      const m = a.href.match(/\/opus\/(\d+)/);
      if (!m) return;
      const card = a.closest('div[class*="opus"], div[class*="card"], li') || a.parentElement;
      items.push({
        id: m[1],
        text: (card && card.innerText ? card.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 120)
      });
    });
    return { title: document.title, count: items.length, items: items.slice(0, 10) };
  });
  console.log('status', res && res.status());
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\bili-upload-opus.png', fullPage: false });
} catch (e) {
  console.log('ERR', String(e).slice(0, 120));
}
await browser.close();
