import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const OUT = '_tmp/cn-official-opus.json';
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
await page.goto('https://space.bilibili.com/1311127373/upload/opus', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));

const seen = new Map();
for (let i = 0; i < 40; i++) {
  const batch = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/opus/"]').forEach((a) => {
      const m = a.href.match(/\/opus\/(\d+)/);
      if (!m) return;
      const card = a.closest('div[class*="opus"], div[class*="card"], li') || a.parentElement;
      out.push({
        id: m[1],
        text: (card && card.innerText ? card.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 160)
      });
    });
    return out;
  });
  batch.forEach((b) => {
    if (!seen.has(b.id)) seen.set(b.id, b);
  });
  await page.evaluate(() => window.scrollBy(0, 2400));
  await new Promise((r) => setTimeout(r, 1400));
  if (i % 10 === 9) console.log('collected', seen.size);
}
await browser.close();

const list = [...seen.values()];
fs.writeFileSync(OUT, JSON.stringify(list, null, 1), 'utf8');
console.log('total opus', list.length);
const updates = list.filter((x) => /更新情报|新曲|追加|删除|下架/.test(x.text));
console.log('候选更新帖', updates.length);
updates.slice(0, 20).forEach((x) => console.log(x.id, '|', x.text.slice(0, 60)));
