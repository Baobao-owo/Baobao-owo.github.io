import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'D:\\Deepseek work\\blog\\_shots';
const ORIGIN = process.env.POST_URL || 'https://baobao-owo.github.io/2026/11/08/chunithm-15-study/';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

// 先从真实页面拿到 iframe 地址（保证参数和站点上一致）
const site = await browser.newPage();
await site.setViewport({ width: 1440, height: 1000 });
await site.goto(ORIGIN, { waitUntil: 'networkidle2', timeout: 45000 });
await site.evaluate(() => {
  const c = document.querySelector('#post_comment');
  if (c) c.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 6000));
const src = await site.evaluate(() => {
  const f = document.querySelector('iframe.giscus-frame');
  return f ? f.src : null;
});
console.log('iframe src ok:', !!src);

// 单独打开 widget，看它自己渲染出的内容
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 800 });
await page.goto(src, { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise((r) => setTimeout(r, 4000));
const info = await page.evaluate(() => ({
  text: (document.body.innerText || '').replace(/\n+/g, ' | ').slice(0, 400),
  height: document.body.scrollHeight,
}));
console.log('widget text:', JSON.stringify(info.text));
console.log('widget height:', info.height);
await page.setViewport({ width: 1000, height: Math.max(500, info.height + 40) });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}\\giscus-widget.png`, fullPage: true });
await browser.close();
