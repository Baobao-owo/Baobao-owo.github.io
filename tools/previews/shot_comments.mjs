import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'D:\\Deepseek work\\blog\\_shots';
const URL = process.env.POST_URL || 'https://baobao-owo.github.io/2026/11/11/hello-blog/';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise((r) => setTimeout(r, 1500));

const state = await page.evaluate(() => {
  const card = document.querySelector('#post_comment');
  if (card) card.scrollIntoView({ block: 'center' });
  return {
    hasCard: !!card,
    hasDiv: !!document.querySelector('#giscus'),
    iframes: document.querySelectorAll('iframe.giscus-frame').length,
  };
});
await new Promise((r) => setTimeout(r, 4000));

const after = await page.evaluate(() => {
  const f = document.querySelector('iframe.giscus-frame');
  return {
    iframe: !!f,
    src: f ? f.src.slice(0, 90) : null,
    frameText: f ? (() => { try { return 'cross-origin'; } catch { return null; } })() : null,
  };
});
console.log('state', JSON.stringify(state), 'after', JSON.stringify(after));

// 截评论卡片整块（按卡片真实宽度裁，别切掉登录按钮）
const box = await page.evaluate(() => {
  const c = document.querySelector('#post_comment');
  if (!c) return null;
  c.scrollIntoView({ block: 'start' });
  const r = c.getBoundingClientRect();
  return {
    x: Math.max(0, Math.round(r.left)),
    top: Math.max(0, r.top + window.scrollY),
    w: Math.min(Math.round(r.width), 1200),
    h: Math.min(Math.round(r.height) + 24, 760),
  };
});
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${OUT}\\live-comments.png`, clip: { x: box.x, y: box.top, width: box.w, height: box.h } });
console.log('clip', JSON.stringify(box));

// 夜间模式下的评论
await page.evaluate(() => window.setDarkmode && window.setDarkmode(true));
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: `${OUT}\\live-comments-dark.png`, clip: { x: box.x, y: box.top, width: box.w, height: box.h } });

await browser.close();
