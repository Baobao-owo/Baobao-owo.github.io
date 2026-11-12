// 抓 B 站「中二节奏CHUNITHM」官号动态（mid 1311127373），找曲目删除公告
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const MID = '1311127373';
const OUT = '_tmp/cn-official-dynamics.json';
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
await page.goto(`https://space.bilibili.com/${MID}/dynamic`, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));

const posts = new Map();
for (let i = 0; i < 25; i++) {
  const batch = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/opus/"]').forEach((a) => {
      const m = a.href.match(/\/opus\/(\d+)/);
      if (!m) return;
      const card = a.closest('.bili-dyn-item, [class*="dyn-item"], [class*="card"]') || a.parentElement;
      const text = (card && card.innerText ? card.innerText : '').replace(/\s+/g, ' ').trim();
      out.push({ id: m[1], text });
    });
    return out;
  });
  batch.forEach((b) => {
    if (!posts.has(b.id) && b.text.length > 40) posts.set(b.id, b);
  });
  await page.evaluate(() => window.scrollBy(0, 2200));
  await new Promise((r) => setTimeout(r, 1500));
  if (i % 5 === 4) console.log('collected', posts.size);
}
await browser.close();

const list = [...posts.values()];
fs.writeFileSync(OUT, JSON.stringify(list, null, 1), 'utf8');
console.log('posts', list.length);
const hit = list.filter((p) => /删除|下架|配信停止|移除/.test(p.text));
console.log('含删除关键词', hit.length);
hit.slice(0, 5).forEach((p) => console.log('---', p.id, p.text.slice(0, 160)));
