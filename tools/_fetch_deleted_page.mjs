import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
const title = '配信終了・日本版未収録';
const url = 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(title);
const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const html = await page.content();
fs.writeFileSync('_tmp/wiki-deleted-page.html', html, 'utf8');
const text = await page.evaluate(() => document.body.innerText);
console.log('status', res && res.status(), 'html', html.length, 'text', text.length);
const i = text.indexOf("WORLD'S END");
console.log(text.slice(0, 600).replace(/\n+/g, ' | '));
await browser.close();
