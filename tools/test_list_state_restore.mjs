import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// 开「仅显示合作」
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const q = document.querySelector('#chuni-designer-q');
  q.value = 'じゃこレモン';
  q.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  const chip = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
  if (chip) chip.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 500));
const before = await page.evaluate(() => ({
  collab: document.querySelector('#chuni-collab-toggle').classList.contains('active'),
  count: document.querySelector('#chuni-count').textContent,
}));

// 点进第一首歌
await page.evaluate(() => {
  const a = document.querySelector('#chuni-list a[href^="/chuni/"]');
  if (a) a.click();
});
await new Promise((r) => setTimeout(r, 2500));
const songUrl = page.url();

// 浏览器返回
await page.goBack({ waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
await new Promise((r) => setTimeout(r, 2500));
const after = await page.evaluate(() => ({
  collab: document.querySelector('#chuni-collab-toggle')?.classList.contains('active'),
  count: document.querySelector('#chuni-count')?.textContent,
  toggleActive: document.querySelector('#chuni-designer-toggle')?.classList.contains('active'),
  navType: (performance.getEntriesByType('navigation')[0]||{}).type,
  dbg: window.__dbg ? window.__dbg() : null,
  storage: sessionStorage.getItem('chuni-list-state-v1'),
}));

console.log('song url:', songUrl);
console.log('before:', JSON.stringify(before));
console.log('after :', JSON.stringify(after));
console.log('errors:', JSON.stringify(errs.slice(0, 3)));
await browser.close();
