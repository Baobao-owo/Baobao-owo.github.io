// 抓取所有版本的「楽曲一覧(追加日順)」页面
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = '_tmp/wiki/addorder';
fs.mkdirSync(OUT_DIR, { recursive: true });

const VERSIONS = [
  'CHUNITHM',
  'CHUNITHM PLUS',
  'CHUNITHM AIR',
  'CHUNITHM AIR PLUS',
  'CHUNITHM STAR',
  'CHUNITHM STAR PLUS',
  'CHUNITHM AMAZON',
  'CHUNITHM AMAZON PLUS',
  'CHUNITHM CRYSTAL',
  'CHUNITHM CRYSTAL PLUS',
  'CHUNITHM PARADISE',
  'CHUNITHM PARADISE LOST',
  'CHUNITHM NEW',
  'CHUNITHM NEW PLUS',
  'CHUNITHM SUN',
  'CHUNITHM SUN PLUS',
  'CHUNITHM LUMINOUS',
  'CHUNITHM LUMINOUS PLUS',
  'CHUNITHM VERSE',
  'CHUNITHM X-VERSE',
  'CHUNITHM X-VERSE-X',
  'CHUNITHM Mate',
];

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

let ok = 0;
for (const v of VERSIONS) {
  const name = v + ' 楽曲一覧(追加日順)';
  const out = OUT_DIR + '/' + name.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (fs.existsSync(out) && fs.statSync(out).size > 100000) {
    ok++;
    continue;
  }
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(name), {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const html = await page.content();
    if (/ページが存在しません|有効なWikiName/.test(html)) {
      console.log('  不存在:', v);
      continue;
    }
    fs.writeFileSync(out, html, 'utf8');
    ok++;
    console.log('  ok:', v, html.length);
  } catch (e) {
    console.log('  失败:', v, String(e).slice(0, 60));
  }
  await new Promise((r) => setTimeout(r, 1000));
}
console.log('抓到:', ok, '/', VERSIONS.length);
await browser.close();
