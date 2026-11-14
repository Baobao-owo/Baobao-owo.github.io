import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = process.argv[2] || 'https://www.bilibili.com/opus/1256849044483866632';
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
await new Promise((r) => setTimeout(r, 3000));

const data = await page.evaluate(() => {
  const pick = (sels) => {
    for (const s of sels) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  };
  const content = pick(['.opus-module-content', '.bili-opus-view', '.article-content', '#read-meta']);
  const title = pick(['.opus-module-title', 'h1', '.title']);
  const imgs = Array.from(document.querySelectorAll('img')).map((i) => i.src).filter((s) => s.includes('hdslb.com'));
  return {
    title: title ? title.innerText.trim() : '',
    html: content ? content.innerHTML : '',
    imgCount: imgs.length,
  };
});

fs.writeFileSync('_tmp/bili-opus.html', data.html, 'utf8');
console.log('title:', data.title);
console.log('html length:', data.html.length, ' imgs:', data.imgCount);
await browser.close();
