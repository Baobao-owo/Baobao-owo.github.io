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
await new Promise((r) => setTimeout(r, 2200));

// 开谱师面板 + 仅显示合作
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  const t = document.querySelector('#chuni-collab-toggle');
  if (t && !t.classList.contains('active')) t.click();
});
await new Promise((r) => setTimeout(r, 500));

async function probe(designer, q) {
  await page.evaluate(() => {
    const s = document.querySelector('#chuni-search-title');
    s.value = '';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.evaluate(() => {
    const f = document.querySelector('#chuni-designer-q');
    f.value = '';
    f.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.type('#chuni-designer-q', designer);
  await new Promise((r) => setTimeout(r, 350));
  const picked = await page.evaluate(() => {
    const chip = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
    if (!chip) return null;
    chip.click();
    return chip.getAttribute('data-who');
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate((qq) => {
    const s = document.querySelector('#chuni-search-title');
    s.value = qq;
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await new Promise((r) => setTimeout(r, 700));
  const rows = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.chuni-row')).map((r) => ({
      t: r.querySelector('.chuni-row-title')?.textContent.trim(),
      tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
    }))
  );
  return { picked, rows };
}

console.log('そらいろカリン:', JSON.stringify(await probe('そらいろカリン', 'Unwelcome')));
console.log('じゃこレモン:', JSON.stringify(await probe('じゃこレモン', 'Unwelcome')));
await browser.close();
