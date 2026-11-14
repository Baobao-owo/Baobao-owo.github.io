import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 760, height: 1200, deviceScaleFactor: 2 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2000));

// 找到推球杯那篇文章卡片
const card = await page.evaluateHandle(() => {
  const cards = Array.from(document.querySelectorAll('.post-preview, article, .card'));
  return cards.find((c) => (c.textContent || '').includes('推球杯')) || null;
});
const el = card.asElement();
if (!el) {
  console.log('卡片没找到');
} else {
  const info = await el.evaluate((c) => ({
    hasThumb: !!c.querySelector('.post-thumbnail'),
    thumbSrc: c.querySelector('.post-thumbnail')?.getAttribute('data-original') || '',
    tags: Array.from(c.querySelectorAll('a[rel="tag"], .post-tags a, .tag')).map((a) => a.textContent.trim()),
    textHead: (c.querySelector('.post-content')?.innerText || '').slice(0, 80).replace(/\n/g, ' '),
  }));
  console.log(JSON.stringify(info, null, 1));
  await el.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\bili-card.png' });
  console.log('saved');
}
await browser.close();
