import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = 'https://www.bilibili.com/opus/1256849044483866632';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const meta = await page.evaluate(() => {
  const g = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.getAttribute('content') || el.getAttribute('src') : '';
  };
  return {
    ogImage: g('meta[property="og:image"]'),
    twitter: g('meta[name="twitter:image"]'),
    coverImg: (() => {
      const el = document.querySelector('.opus-module-top img, .bili-dyn-card-opus img, .opus-cover img');
      return el ? el.src : '';
    })(),
  };
});
console.log(JSON.stringify(meta, null, 1));

const url = meta.ogImage || meta.coverImg || meta.twitter;
if (url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.bilibili.com/' } });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync('source/assets/img/bili-opus-act2', { recursive: true });
  const out = 'source/assets/img/bili-opus-act2/cover.jpg';
  fs.writeFileSync(out, buf);
  console.log('saved', out, buf.length, 'bytes');
}
await browser.close();
