import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0,160)));
await page.goto('http://127.0.0.1:4000/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 2500));
await page.evaluate(() => document.querySelector('#chuni-designer-toggle').click());
await new Promise(r => setTimeout(r, 600));
const info = await page.evaluate(() => ({
  placeholder: document.querySelector('#chuni-designer-q')?.placeholder,
  chips: Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).map(x => x.textContent.trim()).slice(0, 6),
  hasUnknown: Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).some(x => x.textContent.includes('制作者不明')),
  looseSummary: document.querySelector('#chuni-designer-loose-summary')?.textContent.trim(),
  looseCount: document.querySelectorAll('#chuni-designer-loose .chuni-dz-chip').length,
}));
console.log(JSON.stringify(info, null, 1));
// 点「制作者不明」
await page.evaluate(() => {
  const chip = Array.from(document.querySelectorAll('#chuni-designer-grid .chuni-dz-chip')).find(x => x.textContent.includes('制作者不明'));
  chip.click();
});
await new Promise(r => setTimeout(r, 900));
const sel = await page.evaluate(() => {
  const rows = Array.from(document.querySelectorAll('.chuni-row')).slice(0, 4);
  return { total: document.querySelector('#chuni-count').textContent.trim(),
    rows: rows.map(r => ({ t: r.querySelector('.chuni-row-title').textContent.trim().slice(0,20), tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '', b: Array.from(r.querySelectorAll('.chuni-row-badges .chuni-badge')).map(x => x.classList.contains('chuni-badge-empty') ? '—' : x.textContent.trim()).join(' ') })) };
});
console.log(JSON.stringify(sel, null, 1));
console.log('errors:', errs.length ? errs.slice(0,3) : 'none');
await page.screenshot({ path: 'D:\\Deepseek work\\about-me\\_shots\\unknown-designer.png' });
await browser.close();
