import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const titles = ['ODDS&ENDS', 'トリスメギストス', '-OutsideR:RequieM-', 'ウルガレオン', '≠彡"/了→'];
const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
fs.mkdirSync('_tmp/wiki/intros', { recursive: true });
for (const t of titles) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  const url = 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(t);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const title = await page.title();
    const html = await page.content();
    const safe = t.replace(/[\\/:*?"<>|]/g, '_');
    fs.writeFileSync(`_tmp/wiki/intros/${safe}.html`, html, 'utf8');
    const has = /曲目|コメント|楽曲/.test(html);
    console.log(JSON.stringify({ t, title, len: html.length, has }));
  } catch (e) {
    console.log(JSON.stringify({ t, fail: String(e).slice(0, 120) }));
  }
  await page.close();
}
await browser.close();
