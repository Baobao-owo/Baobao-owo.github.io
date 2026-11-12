// 从 sdvx.in 抓「配信停止（删除）曲」列表，写成 source/_data/chuni_removed.json
// 数据在 /chunithm/_/json/songs_del.json，需要浏览器上下文同源请求
// 用法: node tools/import_sdvx_removed.mjs
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'source/_data/chuni_removed.json');
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

const data = await page.evaluate(async () => {
  const out = {};
  for (const f of ['songs_del.json', 'songs01.json', 'songs02.json', 'songs03.json', 'songs04.json', 'songs05.json', 'songs06.json']) {
    try {
      const r = await fetch('/chunithm/_/json/' + f);
      const j = await r.json();
      out[f] = Array.isArray(j) ? j : [];
    } catch (e) {
      out[f] = [];
    }
  }
  return out;
});
await browser.close();

function norm(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'"“”‘’・:：;；,，.。~～\-—_]/g, '');
}

const removed = new Set();
for (const f of Object.keys(data)) {
  for (const s of data[f]) {
    if (s && s.removed) removed.add(s.title);
  }
}
console.log('sdvx 标记的删除曲:', removed.size);

const out = { source: 'sdvx.in', updated: new Date().toISOString().slice(0, 10), titles: [], matched: [] };
for (const t of removed) out.titles.push(t);

const ours = new Map();
for (const s of guide.songs) ours.set(norm(s.title), s);
for (const t of removed) {
  const s = ours.get(norm(t));
  if (s) out.matched.push({ t: s.title, id: s.id });
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 0), 'utf8');
console.log('写入', OUT, '| 匹配到我们曲库', out.matched.length, '首');
console.log('示例:', out.matched.slice(0, 10).map((x) => x.t).join(' / '));
