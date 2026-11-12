import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const id = process.argv[2] || '1259725942475980849';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.setViewport({ width: 1400, height: 1200 });
await page.goto(`https://www.bilibili.com/opus/${id}`, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));
const info = await page.evaluate(() => {
  const imgs = [];
  document.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src || '';
    if (src.includes('hdslb') || src.includes('bili')) {
      imgs.push({ src, w: img.naturalWidth, h: img.naturalHeight });
    }
  });
  return {
    text: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 500),
    imgs: imgs.slice(0, 20)
  };
});
console.log(JSON.stringify(info, null, 1).slice(0, 2500));
fs.writeFileSync(`_tmp/opus-${id}.json`, JSON.stringify(info, null, 1), 'utf8');
await browser.close();
