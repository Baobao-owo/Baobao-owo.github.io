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
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });

// 滚到评论区，让 giscus 真正加载并撑开 iframe
await page.evaluate(() => {
  const c = document.querySelector('#post_comment');
  if (c) c.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 6000));
const box = await page.evaluate(() => {
  const c = document.querySelector('#post_comment');
  const r = c.getBoundingClientRect();
  return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
});
console.log('card', JSON.stringify(box));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}\\post-chunithm-full.png`, fullPage: true });
await browser.close();
