// 把 B 站视频简介搬进文章 front-matter（chuni.video_desc）
// 用法：node tools/backfill_chuni_desc.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const dir = path.join(process.cwd(), 'source/_posts');
const force = process.argv.includes('--force');
const files = fs.readdirSync(dir).filter((f) => /^chuni-[0-9a-f]+\.md$/.test(f));

const unescape = (s) =>
  String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.setViewport({ width: 1280, height: 1000 });

function dropDescBlock(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^  video_desc: \|/.test(lines[i])) {
      i++;
      while (i < lines.length && (/^    /.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '') break;
        i++;
      }
      i--;
      continue;
    }
    out.push(lines[i]);
  }
  return out;
}

function insertDescBlock(lines, desc) {
  const block = ['  video_desc: |', ...String(desc).split('\n').map((l) => '    ' + l)];
  const idx = lines.findIndex((l) => /^  video: /.test(l));
  const at = idx >= 0 ? idx + 1 : lines.findIndex((l) => /^  cover: /.test(l));
  if (at < 0) return lines;
  return [...lines.slice(0, at), ...block, ...lines.slice(at)];
}

let added = 0;
let skipped = 0;
let failed = 0;

for (const f of files) {
  const p = path.join(dir, f);
  let text = fs.readFileSync(p, 'utf8');
  if (!force && /\n  video_desc:/.test(text)) {
    skipped++;
    continue;
  }
  const vm = text.match(/\n  video: '([^']+)'/);
  if (!vm) {
    console.log('没有视频链接', f);
    failed++;
    continue;
  }
  const url = vm[1].replace(/\/$/, '') + '/';
  let desc = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 6000));
    desc = await page.evaluate(() => {
      try {
        const s = window.__INITIAL_STATE__;
        if (s && s.videoData && s.videoData.desc) return s.videoData.desc;
      } catch (e) {}
      const el = document.querySelector('.desc-info-text') || document.querySelector('#v_desc');
      return el ? el.innerText.trim() : '';
    });
  } catch (e) {
    console.log('抓取失败', f, String(e).slice(0, 60));
    failed++;
    continue;
  }
  desc = unescape(desc).replace(/\s+$/g, '');
  if (!desc) {
    console.log('简介为空', f);
    failed++;
    continue;
  }
  const lines = dropDescBlock(text.split('\n'));
  const next = insertDescBlock(lines, desc).join('\n');
  if (next !== text) {
    fs.writeFileSync(p, next, 'utf8');
    console.log('ok', path.basename(f), '|', desc.replace(/\n/g, ' / ').slice(0, 50));
    added++;
  } else {
    console.log('没写入', f);
  }
  await new Promise((r) => setTimeout(r, 500));
}

await browser.close();
console.log('\nsummary: written', added, 'skipped', skipped, 'failed', failed);
