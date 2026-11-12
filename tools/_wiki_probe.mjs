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
await page.setViewport({ width: 1280, height: 900 });
try {
  const res = await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent('千本桜'), {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await new Promise((r) => setTimeout(r, 5000));
  const info = await page.evaluate(() => ({
    title: document.title,
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
    challenge: /Just a moment|Attention Required|Cloudflare/.test(document.documentElement.innerHTML)
  }));
  console.log('status', res && res.status(), JSON.stringify(info));
  const html = await page.content();
  fs.writeFileSync('_tmp/wiki-probe.html', html, 'utf8');
} catch (e) {
  console.log('ERR', String(e).slice(0, 120));
}
await browser.close();
