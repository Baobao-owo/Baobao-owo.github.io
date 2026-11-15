import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: 'new', args: ['--no-sandbox','--disable-gpu'] });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4000/chuni/' + encodeURIComponent('千本桜-d9632b') + '/', { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise(r => setTimeout(r, 1500));
const info = await page.evaluate(() => Array.from(document.querySelectorAll('.chuni-confirm-row')).map(r => r.textContent.replace(/\s+/g,' ').trim()));
console.log(JSON.stringify(info));
await browser.close();
