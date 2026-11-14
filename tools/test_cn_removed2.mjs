import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2000));

const read = () => page.evaluate(() => ({
  count: document.querySelector('#chuni-count').textContent,
  hideRemoved: document.querySelector('#chuni-hide-removed').classList.contains('active'),
  removed: document.querySelector('#chuni-removed').classList.contains('active'),
}));

// 切国服
await page.evaluate(() => document.querySelector('#chuni-version button[data-version="cn"]').click());
await new Promise((r) => setTimeout(r, 700));
console.log('国服（默认隐藏删除曲）:', JSON.stringify(await read()));

// 取消「不显示删除曲」→ 删除曲混进来
await page.evaluate(() => document.querySelector('#chuni-hide-removed').click());
await new Promise((r) => setTimeout(r, 700));
console.log('国服（显示删除曲）:', JSON.stringify(await read()));

// 仅显示删除曲
await page.evaluate(() => document.querySelector('#chuni-removed').click());
await new Promise((r) => setTimeout(r, 700));
console.log('国服（仅显示删除曲）:', JSON.stringify(await read()));

await browser.close();
