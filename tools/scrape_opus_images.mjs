import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const OUT_DIR = '_tmp/opus-imgs';
fs.mkdirSync(OUT_DIR, { recursive: true });

const ids = JSON.parse(fs.readFileSync('_tmp/cn-official-opus.json', 'utf8'))
  .filter((x) => /更新情报/.test(x.text))
  .map((x) => x.id);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);

const out = {};
for (const id of ids) {
  try {
    await page.goto(`https://www.bilibili.com/opus/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const info = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll('img').forEach((img) => {
        const src = img.currentSrc || img.src || '';
        if (src.includes('new_dyn')) imgs.push({ src, w: img.naturalWidth, h: img.naturalHeight });
      });
      const title = document.title;
      return { title, imgs };
    });
    out[id] = info;
    console.log(id, info.title.slice(0, 30), 'imgs', info.imgs.length);
  } catch (e) {
    console.log('ERR', id, String(e).slice(0, 60));
  }
  await new Promise((r) => setTimeout(r, 800));
}
await browser.close();
fs.writeFileSync('_tmp/opus-images.json', JSON.stringify(out, null, 1), 'utf8');
console.log('done', Object.keys(out).length);
