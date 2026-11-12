// 给已有的中二自制谱文章补上 B 站视频链接（从 pgko 歌包页抓）
// 用法：node tools/backfill_chuni_video.mjs
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const dir = path.join(process.cwd(), 'source/_posts');
const files = fs.readdirSync(dir).filter((f) => /^chuni-[0-9a-f]+\.md$/.test(f));

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });

let added = 0;
let skipped = 0;
let none = 0;

for (const f of files) {
  const p = path.join(dir, f);
  let text = fs.readFileSync(p, 'utf8');
  if (/\n  video:/.test(text)) {
    skipped++;
    continue;
  }
  const m = text.match(/\n  bundle: '([^']+)'/);
  if (!m) {
    console.log('没有歌包链接', f);
    continue;
  }
  const url = m[1];
  let video = '';
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    video = await page.evaluate(() => {
      const a = document.querySelector('a[href*="bilibili.com/video"]');
      return a ? a.href : '';
    });
  } catch (e) {
    console.log('抓取失败', f, String(e).slice(0, 60));
    continue;
  }
  if (!video) {
    console.log('没有视频链接', f);
    none++;
    continue;
  }
  text = text.replace(/\n  bundle: '[^']+'\n/, (s) => s + `  video: '${video}'\n`);
  fs.writeFileSync(p, text, 'utf8');
  console.log('added', path.basename(f), video);
  added++;
  await new Promise((r) => setTimeout(r, 300));
}

await browser.close();
console.log('\nsummary: added', added, 'skipped', skipped, 'no video', none);
