import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'https://baobao-owo.github.io';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

async function pickDesigner(name) {
  await page.evaluate(() => {
    const el = document.querySelector('#chuni-search-title');
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.click('#chuni-designer-toggle');
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const q = document.querySelector('#chuni-designer-q');
    q.value = '';
    q.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.type('#chuni-designer-q', name);
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const chip = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
    if (chip) chip.click();
  });
  await page.click('#chuni-designer-close');
  await new Promise((r) => setTimeout(r, 400));
}

async function search(q) {
  await page.evaluate((qq) => {
    const el = document.querySelector('#chuni-search-title');
    el.value = qq;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await new Promise((r) => setTimeout(r, 600));
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.chuni-row')).map((r) => ({
      t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 44),
      tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
    }))
  );
}

// 打开「仅显示合作」
await page.click('#chuni-designer-toggle');
await page.evaluate(() => document.querySelector('#chuni-collab-toggle').click());
await page.click('#chuni-designer-close');
await new Promise((r) => setTimeout(r, 400));

// 点 A：ミストルティン
await pickDesigner('ミストルティン');
console.log('ミストルティン + PRAGMATISM:', JSON.stringify(await search('PRAGMATISM')));

// 点 B：Redarrow
await pickDesigner('Redarrow');
console.log('Redarrow + PRAGMATISM:', JSON.stringify(await search('PRAGMATISM')));

await browser.close();
