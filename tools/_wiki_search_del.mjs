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
const url = 'https://wikiwiki.jp/chunithmwiki/?cmd=search&word=' + encodeURIComponent('配信停止');
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const res = await page.evaluate(() => {
  const links = [];
  document.querySelectorAll('a[href^="/chunithmwiki/"]').forEach((a) => {
    const t = (a.innerText || '').trim();
    if (!t || a.href.includes('::')) return;
    links.push({ href: a.getAttribute('href'), text: t });
  });
  return links.slice(0, 40);
});
console.log(JSON.stringify(res, null, 1));
await browser.close();
