import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto(BASE + '/chuni/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).find((c) => c.textContent.includes('ぴちネコ')).click();
});
await new Promise((r) => setTimeout(r, 600));

for (const q of ['X7124', 'Oshama', 'Killing Rhythm']) {
  await page.evaluate((qq) => {
    const s = document.querySelector('#chuni-search-title');
    s.value = qq;
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await new Promise((r) => setTimeout(r, 600));
  const info = await page.evaluate(() => ({
    count: document.querySelector('#chuni-count').textContent,
    titles: Array.from(document.querySelectorAll('.chuni-row-title')).map((t) => t.textContent.trim()).slice(0, 3),
  }));
  console.log(q, '=>', JSON.stringify(info));
}
await browser.close();
