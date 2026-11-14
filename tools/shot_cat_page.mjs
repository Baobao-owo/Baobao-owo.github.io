import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PATH = '/categories/杂谈/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1200, deviceScaleFactor: 2 });
await page.goto(BASE + encodeURI(PATH), { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

const info = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('.post-preview, .card, article'));
  const card = cards.find((c) => (c.textContent || '').includes('推球杯'));
  if (!card) return { found: false, cards: cards.length };
  return {
    found: true,
    hasThumb: !!card.querySelector('.post-thumbnail'),
    thumb: card.querySelector('.post-thumbnail')?.getAttribute('data-original') || '',
    tags: Array.from(card.querySelectorAll('a[rel="tag"], .post-tags a')).map((a) => a.textContent.trim()),
    excerpt: (card.querySelector('.post-content')?.innerText || '').slice(0, 60).replace(/\n/g, ' '),
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\bili-cat.png', fullPage: false });
await browser.close();
