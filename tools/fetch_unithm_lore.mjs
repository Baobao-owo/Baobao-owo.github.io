// 抓 copel-popn 的 UHUNITHM 剧情页（SPA，需要渲染）
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_tmp/refs');
fs.mkdirSync(OUT, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(UA);

const url = 'https://copel-popn.github.io/#/penguin/unithm';
try {
  const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 4000));
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(OUT, 'unithm.txt'), text, 'utf8');
  console.log('status', res && res.status(), 'len', text.length);
  console.log(text.slice(0, 800).replace(/\n+/g, ' | '));
} catch (e) {
  console.log('ERR', String(e).slice(0, 120));
}
await browser.close();
