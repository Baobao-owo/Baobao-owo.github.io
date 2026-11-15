import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:4321';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2200));

await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 400));
await page.type('#chuni-designer-q', 'Techno Kitchen');
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => document.querySelector('#chuni-designer-grid .chuni-dz-chip').click());
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await new Promise((r) => setTimeout(r, 600));

async function probe(q) {
  await page.evaluate((qq) => {
    const el = document.querySelector('#chuni-search-title');
    el.value = qq;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await new Promise((r) => setTimeout(r, 600));
  return await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.chuni-row'));
    return rows.map((r) => ({
      t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 40),
      tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
    }));
  });
}

for (const q of ['蜘蛛の糸', 'irony', 'ヴンダーカンマー', 'Elemental Creation']) {
  console.log(q, '=>', JSON.stringify(await probe(q)));
}
console.log('errors:', JSON.stringify(errors.slice(0, 3)));
await browser.close();
