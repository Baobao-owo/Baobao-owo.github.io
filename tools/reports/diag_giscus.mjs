import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'D:\\Deepseek work\\blog\\_shots';
const POST = 'https://baobao-owo.github.io/2026/11/11/hello-blog/';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 800 });

const fails = [];
page.on('requestfailed', (r) => fails.push(r.url().slice(0, 100) + ' :: ' + (r.failure()?.errorText || '')));

await page.goto(POST, { waitUntil: 'networkidle2', timeout: 45000 });
await new Promise((r) => setTimeout(r, 5000));
const src = await page.evaluate(() => {
  const f = document.querySelector('iframe.giscus-frame');
  return f ? f.src : null;
});
console.log('iframe src:', src ? src.slice(0, 160) : null);
console.log('request failures:', JSON.stringify(fails.slice(0, 6)));

// 直接打开 iframe 地址（同源），读它自己渲染出来的文字
if (src) {
  await page.goto(src, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));
  const info = await page.evaluate(() => ({
    text: (document.body.innerText || '').slice(0, 600),
    hasLogin: !!document.querySelector('a[href*="github.com/login"]'),
    title: document.title,
  }));
  console.log('widget text:', JSON.stringify(info.text));
  console.log('has login link:', info.hasLogin);
  await page.screenshot({ path: `${OUT}\\giscus-widget.png`, fullPage: false });
}
await browser.close();
