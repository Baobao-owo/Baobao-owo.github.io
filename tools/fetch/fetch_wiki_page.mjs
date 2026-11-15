import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = process.env.WIKI_URL || 'https://wikiwiki.jp/chunithmwiki/%E8%AD%9C%E9%9D%A2%E5%88%B6%E4%BD%9C%E8%80%85%E4%B8%80%E8%A6%A71';
const OUT = process.env.WIKI_OUT || 'D:\\Deepseek work\\blog\\_tmp\\wiki\\designers1.html';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
await page.setViewport({ width: 1400, height: 1200 });
try {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  const html = await page.content();
  fs.writeFileSync(OUT, html, 'utf8');
  console.log('saved', OUT, html.length);
} catch (e) {
  console.log('FAIL', String(e).slice(0, 160));
}
await browser.close();
