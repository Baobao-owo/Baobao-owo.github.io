// 抓萌娘百科参考页，存全文供术语核对
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_tmp/refs');
fs.mkdirSync(OUT, { recursive: true });

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const PAGES = [
  ['CHUNITHM', 'https://zh.moegirl.org.cn/' + encodeURIComponent('CHUNITHM')],
  ['用语', 'https://zh.moegirl.org.cn/' + encodeURIComponent('音乐游戏/用语')],
  ['梗', 'https://zh.moegirl.org.cn/' + encodeURIComponent('音乐游戏/梗')]
];

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(UA);

for (const [name, url] of PAGES) {
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(path.join(OUT, name + '.txt'), text, 'utf8');
    console.log(name, res && res.status(), text.length);
  } catch (e) {
    console.log(name, 'ERR', String(e).slice(0, 80));
  }
  await new Promise((r) => setTimeout(r, 1500));
}
await browser.close();
