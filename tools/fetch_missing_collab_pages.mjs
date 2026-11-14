// 对抓不到的曲目，用 wiki 站内搜索找回正确页面名，再抓页面
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIR = '_tmp/wiki/songpage';
fs.mkdirSync(DIR, { recursive: true });

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
const squash = (s) => String(s || '').normalize('NFKC').replace(/[\s\u3000]+/g, '').toLowerCase();

const MISSES = JSON.parse(fs.readFileSync('_tmp/wiki/collab-misses.json', 'utf8'));

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
);

let found = 0;
let failed = 0;

for (const title of MISSES) {
  const q = encodeURIComponent(title);
  try {
    await page.goto('https://wikiwiki.jp/chunithmwiki/?cmd=search&word=' + q, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a')).map((a) => ({ href: a.getAttribute('href') || '', text: a.textContent.trim() }))
    );
    const cand = links
      .filter((l) => l.href.includes('/chunithmwiki/') && !l.href.includes('::cmd') && l.text.length > 3)
      .map((l) => ({ ...l, href: decodeURIComponent(l.href) }));

    const target = squash(title);
    // 优先：页面名 = 标题；其次：互相包含
    let pick = cand.find((l) => squash(l.href.replace('/chunithmwiki/', '')) === target);
    if (!pick) pick = cand.find((l) => squash(l.href.replace('/chunithmwiki/', '')) === squash(l.text) && squash(l.text) === target);
    if (!pick) {
      pick = cand.find((l) => {
        const t = squash(l.href.replace('/chunithmwiki/', ''));
        return t.length > 4 && (target.includes(t) || t.includes(target)) && Math.abs(t.length - target.length) <= 6;
      });
    }
    if (!pick) {
      failed++;
      console.log('  没找到:', title);
      continue;
    }
    const wikiTitle = pick.href.replace('/chunithmwiki/', '').replace(/_/g, ' ');
    await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(wikiTitle), {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const html = await page.content();
    if (!html.includes('譜面作者')) {
      failed++;
      console.log('  页面无署名行:', title, '→', wikiTitle);
      continue;
    }
    fs.writeFileSync(DIR + '/' + wikiTitle.replace(/[\\/:*?"<>|]/g, '_') + '.html', html, 'utf8');
    found++;
    console.log('  ok:', title, '→', wikiTitle);
  } catch (e) {
    failed++;
    console.log('  失败:', title, String(e).slice(0, 60));
  }
  await new Promise((r) => setTimeout(r, 1200));
}

await browser.close();
console.log('搜索补抓 成功', found, '失败', failed);
