// 从 sdvx.in 谱面保管所抓 YouTube 确认视频（只取 MASTER / ULTIMA）
// 数据在 /chunithm/_/json/songs0X.json，需要浏览器上下文同源请求
// 用法: node tools/import_sdvx_youtube.mjs
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'source/_data/chuni_youtube.json');
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.goto('https://sdvx.in/chunithm.php', { waitUntil: 'networkidle2', timeout: 90000 });

const songs = await page.evaluate(async () => {
  const files = ['songs01.json', 'songs02.json', 'songs03.json', 'songs04.json', 'songs05.json', 'songs06.json', 'songs_del.json'];
  const out = [];
  for (const f of files) {
    try {
      const r = await fetch('/chunithm/_/json/' + f);
      const j = await r.json();
      if (Array.isArray(j)) out.push(...j);
    } catch (e) {}
  }
  return out;
});
await browser.close();
console.log('拿到位:', songs.length, '条 sdvx 记录');

function norm(s) {
  return String(s)
    .normalize('NFKC')
    .replace(/[\[\]【】()（）「」『』]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const index = new Map();
for (const s of guide.songs) {
  const k = norm(s.title);
  if (!index.has(k)) index.set(k, s);
}

const out = {};
let matched = 0;
let unmatched = 0;

for (const s of songs) {
  const yt = s.youtube || {};
  const mst = [yt.mst1, yt.mst2].filter((x) => x && x !== '_');
  const ult = [yt.ult1, yt.ult2].filter((x) => x && x !== '_');
  if (!mst.length && !ult.length) continue;
  const song = index.get(norm(s.title));
  if (!song) {
    unmatched++;
    continue;
  }
  const entry = out[song.title] || (out[song.title] = {});
  if (mst.length) entry.M = mst;
  if (ult.length) entry.U = ult;
  matched++;
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
console.log('匹配成功', matched, '首，未匹配', unmatched, '| 有 YouTube 的曲目', Object.keys(out).length);
const k = Object.keys(out)[0];
if (k) console.log('示例:', k, JSON.stringify(out[k]));
