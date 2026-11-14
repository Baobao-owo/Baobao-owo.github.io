// 从 wiki 的「楽曲一覧」索引页建立 曲名 → 页面名 映射，用于找回抓不到的页面
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

const PAGES = ['CHUNITHM Mate 楽曲一覧(追加日順)', 'CHUNITHM Mate 楽曲一覧(定数順1)', 'CHUNITHM Mate 楽曲一覧(定数順2)', 'CHUNITHM Mate 楽曲一覧(定数順3)', 'CHUNITHM Mate 楽曲一覧(Lv順1)', 'CHUNITHM Mate 楽曲一覧(Lv順2)'];
const map = {};

for (const p of PAGES) {
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(p), { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const items = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((a) => ({
        href: decodeURIComponent(a.getAttribute('href') || ''),
        text: a.textContent.trim(),
      }))
    );
    let n = 0;
    for (const it of items) {
      if (!it.href.startsWith('/chunithmwiki/') || it.href.includes('::cmd')) continue;
      const title = it.href.replace('/chunithmwiki/', '');
      if (!title || title.startsWith('#') || title.includes('/')) continue;
      if (!it.text || it.text.length < 2) continue;
      if (map[it.text]) continue;
      map[it.text] = title;
      n++;
    }
    console.log(p, '=> 收录', n, '条');
  } catch (e) {
    console.log('ERR', p, String(e).slice(0, 80));
  }
}

fs.writeFileSync('_tmp/wiki/page-index.json', JSON.stringify(map, null, 1), 'utf8');
console.log('索引总条数:', Object.keys(map).length);
await browser.close();
