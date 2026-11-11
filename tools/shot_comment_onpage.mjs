import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'D:\\Deepseek work\\blog\\_shots';
const URL = 'https://baobao-owo.github.io/2026/11/08/chunithm-15-study/';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });

// 滚到评论区，等 iframe 加载 + 撑高
await page.evaluate(() => document.querySelector('#post_comment').scrollIntoView({ block: 'center' }));
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const h = await page.evaluate(() => document.querySelector('iframe.giscus-frame')?.getBoundingClientRect().height || 0);
  if (h > 450) break;
}

const box = await page.evaluate(() => {
  const c = document.querySelector('#post_comment');
  c.scrollIntoView({ block: 'start' });
  const r = c.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) };
});
await new Promise((r) => setTimeout(r, 500));
console.log('card box', JSON.stringify(box));
await page.screenshot({ path: `${OUT}\\live-comments.png`, clip: { x: box.x, y: box.y, width: box.w, height: Math.min(box.h + 8, 1000) } });
await browser.close();
