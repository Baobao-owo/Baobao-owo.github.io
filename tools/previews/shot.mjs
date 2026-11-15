import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://127.0.0.1:4000';
const OUT = 'D:\\Deepseek work\\blog\\_shots';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

const page = await browser.newPage();
const problems = [];
page.on('console', (m) => {
  if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 160));
});
page.on('pageerror', (e) => problems.push('pageerror: ' + String(e).slice(0, 160)));
page.on('requestfailed', (r) => problems.push('reqfail: ' + r.url().slice(0, 120)));

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

const routes = [
  ['home', '/'],
  ['post', '/2026/11/11/hello-blog/'],
  ['archives', '/archives/'],
  ['about', '/about/'],
  ['category', '/categories/' + encodeURIComponent('折腾') + '/'],
];

for (const [name, path] of routes) {
  await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise((r) => setTimeout(r, 1200));
  const info = await page.evaluate(() => {
    const banner = document.querySelector('#banner');
    const first = document.querySelector('#primary');
    return {
      title: document.title,
      bannerH: banner ? Math.round(banner.getBoundingClientRect().height) : null,
      contentTop: first ? Math.round(first.getBoundingClientRect().top) : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      docH: document.documentElement.scrollHeight,
      live2d: Array.from(document.querySelectorAll('canvas')).map((c) => {
        const r = c.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height)];
      }),
      codeWidth: (() => {
        const f = document.querySelector('#post_content figure.highlight, #post_content pre');
        return f ? Math.round(f.getBoundingClientRect().width) : null;
      })(),
    };
  });
  console.log(name, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}\\${name}-pp.png`, fullPage: true });
}

// 夜间模式
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await page.evaluate(() => window.setDarkmode && window.setDarkmode(true));
await new Promise((r) => setTimeout(r, 900));
console.log('dark', JSON.stringify(await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor }))));
await page.screenshot({ path: `${OUT}\\dark-pp.png`, fullPage: true });

await page.goto(BASE + '/2026/11/11/hello-blog/', { waitUntil: 'networkidle2' });
await page.evaluate(() => window.setDarkmode && window.setDarkmode(true));
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: `${OUT}\\dark-post-pp.png`, fullPage: true });

// 搜索
await page.evaluate(() => window.setDarkmode && window.setDarkmode(false));
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await page.evaluate(() => document.querySelector('#navbar_search_btn_pc').click());
await new Promise((r) => setTimeout(r, 700));
await page.type('#local-search-input', '谱面', { delay: 80 });
await new Promise((r) => setTimeout(r, 1800));
const searchInfo = await page.evaluate(() => {
  const box = document.querySelector('#local-search-result');
  return {
    resultLen: box ? box.innerHTML.trim().length : -1,
    items: Array.from(document.querySelectorAll('#local-search-result a')).slice(0, 4).map((a) => a.textContent.trim()),
  };
});
console.log('search', JSON.stringify(searchInfo));
await page.screenshot({ path: `${OUT}\\search-pp.png` });

// 手机端
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));
const mobile = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  live2d: Array.from(document.querySelectorAll('canvas')).map((c) => {
    const r = c.getBoundingClientRect();
    return [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.bottom)];
  }),
}));
console.log('mobile', JSON.stringify(mobile));
await page.screenshot({ path: `${OUT}\\mobile-pp.png`, fullPage: true });

const searchResp = await page.goto(BASE + '/search.xml', { waitUntil: 'domcontentloaded' });
console.log('search.xml', searchResp.status());
console.log('problems', JSON.stringify(problems.slice(0, 10)));
await browser.close();
