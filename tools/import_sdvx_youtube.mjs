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
  const files = ['songs01.json', 'songs02.json', 'songs03.json', 'songs04.json', 'songs05.json', 'songs06.json', 'songs07.json', 'songs08.json', 'songs09.json', 'songs10.json', 'songs11.json'];
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

const keyOf = (t) =>
  String(t || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '')
    .replace(/[&＆]/g, 'and')
    .replace(/[\s\u3000]/g, '');
const coreOf = (t) =>
  String(t || '').replace(/[\(（\[［【][^\)）\]］】]*[\)）\]］】]\s*$/g, '').trim();

const index = new Map();
const coreIndex = new Map();
for (const s of guide.songs) {
  const k = keyOf(s.title);
  if (k && !index.has(k)) index.set(k, s);
  const c = keyOf(coreOf(s.title));
  if (c && !coreIndex.has(c)) coreIndex.set(c, s);
}
function findSong(title, artist) {
  const k = keyOf(title);
  if (index.has(k)) return index.get(k);
  const c = keyOf(coreOf(title));
  if (coreIndex.has(c)) return coreIndex.get(c);
  if (artist) {
    const ka = k + '|' + keyOf(artist);
    for (const s of guide.songs) if (keyOf(s.title) + '|' + keyOf(s.artist) === ka) return s;
  }
  return null;
}

const out = {};
let matched = 0;
let unmatched = 0;

for (const s of songs) {
  const yt = s.youtube || {};
  const mst = [yt.mst1, yt.mst2].filter((x) => x && x !== '_');
  const ult = [yt.ult1, yt.ult2].filter((x) => x && x !== '_');
  if (!mst.length && !ult.length) continue;
  const song = findSong(s.title, s.artist);
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
