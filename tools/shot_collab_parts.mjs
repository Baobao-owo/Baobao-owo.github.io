import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 1600, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4321/chuni/battle-no-1-a5fe4e/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const el = await page.$('.chuni-parts-table');
if (!el) {
  console.log('NO TABLE');
} else {
  const box = await el.boundingBox();
  const sec = await page.evaluateHandle((b) => {
    const t = document.querySelector('.chuni-parts-table');
    return t.closest('.chuni-section');
  });
  await (await sec.asElement()).screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\collab-parts.png' });
  console.log('saved, box', JSON.stringify({ x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }));
}
await browser.close();
