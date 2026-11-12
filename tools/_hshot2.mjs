import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu','--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto('http://127.0.0.1:4000/chuni/' + encodeURIComponent('初音ミクの消失-adbfef') + '/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 2000));
const info = await page.evaluate(() => ({
  sections: Array.from(document.querySelectorAll('.chuni-section-title')).map(e => e.textContent.trim()),
  histRows: document.querySelectorAll('.chuni-history-table tbody tr').length,
  titleRows: document.querySelectorAll('.chuni-detail-table tbody tr').length,
  origins: document.querySelectorAll('.chuni-origins li').length,
}));
console.log(JSON.stringify(info));
await page.evaluate(() => { const el = document.querySelector('.chuni-history-table'); if (el) el.scrollIntoView({ block: 'start' }); });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\chuni-history.png', fullPage: false });
await browser.close();
