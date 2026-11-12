// 抓 B 站某个 UP 的投稿列表（标题 + BV），用于匹配曲目
// 用法: node tools/scrape_bili_uploads.mjs [--mid 1573728] [--scroll 40]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] || def : def;
};
const MID = opt('mid', '1573728');
const SCROLLS = Number(opt('scroll', '40'));

const outFile = path.join(process.cwd(), '_tmp/bili_uploads.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto(`https://space.bilibili.com/${MID}/upload/video`, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 5000));

const seen = new Map();
for (let i = 0; i < SCROLLS; i++) {
  const batch = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/video/BV"]').forEach((a) => {
      const m = a.href.match(/\/video\/(BV[0-9A-Za-z]+)/);
      if (!m) return;
      const title = (a.getAttribute('title') || a.innerText || '').replace(/\s+/g, ' ').trim();
      if (title) out.push({ bv: m[1], title });
    });
    return out;
  });
  batch.forEach((v) => {
    if (!seen.has(v.bv)) seen.set(v.bv, v);
  });
  await page.evaluate(() => window.scrollBy(0, 2400));
  await new Promise((r) => setTimeout(r, 1500));
  if (i % 5 === 4) console.log('已收集', seen.size);
}

await browser.close();
const list = Array.from(seen.values());
fs.writeFileSync(outFile, JSON.stringify(list, null, 1), 'utf8');
console.log('总计', list.length, '个视频 →', outFile);
console.log(JSON.stringify(list.slice(0, 5), null, 1));
