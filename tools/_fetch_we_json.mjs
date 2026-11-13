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
await page.goto('https://sdvx.in/chunithm.php', { waitUntil: 'networkidle2', timeout: 90000 });
const data = await page.evaluate(async () => {
  const r = await fetch('/chunithm/_/json/songs_we.json');
  return await r.json();
});
await browser.close();
console.log('entries', data.length);
console.log(JSON.stringify(data[0]).slice(0, 500));
fs.writeFileSync('_tmp/sdvx-we.json', JSON.stringify(data), 'utf8');
