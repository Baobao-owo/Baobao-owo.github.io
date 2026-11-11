import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'https://baobao-owo.github.io';
const OUT = 'D:\\Deepseek work\\blog\\_shots';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 140)); });
page.on('requestfailed', (r) => problems.push('reqfail: ' + r.url().slice(0, 120)));

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const routes = [
  ['live-home', '/'],
  ['live-post', '/2026/11/11/hello-blog/'],
  ['live-archives', '/archives/'],
];

for (const [name, path] of routes) {
  const resp = await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1200));
  const info = await page.evaluate(() => ({
    title: document.title,
    docH: document.documentElement.scrollHeight,
    bannerBg: getComputedStyle(document.querySelector('#banner')).backgroundImage.slice(0, 90),
    avatar: document.querySelector('#leftbar_overview_author_image')?.src,
  }));
  console.log(name, resp.status(), JSON.stringify(info));
  await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: true });
}

// 手机
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1000));
console.log('mobile', JSON.stringify(await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
}))));
await page.screenshot({ path: `${OUT}\\live-mobile.png`, fullPage: true });

// 夜间
await page.setViewport({ width: 1440, height: 900 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await page.evaluate(() => window.setDarkmode && window.setDarkmode(true));
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: `${OUT}\\live-dark.png`, fullPage: false });

// 关键资源
for (const p of ['/assets/css/baobao.css', '/assets/img/banner-euthanasia.jpg', '/search.xml', '/assets/live2d/lib/L2Dwidget.min.js']) {
  const r = await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
  console.log('asset', p, r.status());
}

console.log('problems', JSON.stringify(problems.slice(0, 8)));
await browser.close();
