// 用 MarisaBot 的前端渲染器把谱面截成整张长图（需要它本地的 vite 服务在 5199）
// 用法: node tools/render_bot_chart.mjs 710_3 [--out dir]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BOT_PREVIEW_BASE || 'http://127.0.0.1:5199';
const arg = process.argv[2];
if (!arg) {
  console.error('用法: node tools/render_bot_chart.mjs <musicId>_<levelIndex>');
  process.exit(1);
}
const outIdx = process.argv.indexOf('--out');
const OUT_DIR = outIdx > 0 ? process.argv[outIdx + 1] : path.join(process.cwd(), 'source/assets/chuni/preview');
fs.mkdirSync(OUT_DIR, { recursive: true });

const [musicId, levelIdx] = arg.split('_');
const name = String(musicId).padStart(4, '0') + '_' + String(levelIdx).padStart(2, '0');
const outFile = path.join(OUT_DIR, `${musicId}_${levelIdx}.png`);

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 1 });
const resp = await page.goto(`${BASE}/chunithm/preview?name=${name}`, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 3500));

const info = await page.evaluate(() => ({
  stages: document.querySelectorAll('.stage').length,
  notes: document.querySelectorAll('.note-common, .ln-common, .slide-common').length,
  scrollW: document.documentElement.scrollWidth,
  scrollH: document.documentElement.scrollHeight
}));
console.log('page', resp && resp.status(), JSON.stringify(info));

if (!info.stages) {
  console.error('没有渲染出内容');
  await browser.close();
  process.exit(1);
}

// 让它按内容宽度展开，整张截下来
await page.setViewport({ width: Math.min(info.scrollW, 8000), height: Math.min(info.scrollH, 4000) });
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();
console.log('saved', outFile, Math.round(fs.statSync(outFile).size / 1024), 'KB');
