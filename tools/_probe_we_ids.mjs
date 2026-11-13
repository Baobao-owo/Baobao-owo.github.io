import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.goto('https://sdvx.in/chunithm.php', { waitUntil: 'networkidle2', timeout: 90000 });
const out = await page.evaluate(async () => {
  const res = {};
  for (let i = 1; i <= 11; i++) {
    const f = 'songs' + String(i).padStart(2, '0') + '.json';
    try {
      const r = await fetch('/chunithm/_/json/' + f);
      const j = await r.json();
      if (Array.isArray(j)) res[f] = j;
    } catch (e) {}
  }
  return res;
});
await browser.close();

const all = [];
for (const arr of Object.values(out)) for (const s of arr) all.push(s);
const we = all.filter((s) => Number(s.id) >= 8000);
console.log('总记录', all.length, '| id>=8000:', we.length);
console.log(we.slice(0, 8).map((s) => s.id + ' ' + s.title).join(' | '));
fs.writeFileSync('_tmp/sdvx-all.json', JSON.stringify(all), 'utf8');

// 和我们 WE 曲目对一下
const guide = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const weSongs = guide.songs.filter((s) => (s.sheets || []).length && s.sheets.every((x) => String(x.difficulty).startsWith('【')));
function norm(t) {
  return String(t).normalize('NFKC').toLowerCase().replace(/[\s\u3000]/g, '').replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');
}
const byTitle = new Map();
for (const s of we) byTitle.set(norm(s.title), s);
let hit = 0;
for (const s of weSongs) if (byTitle.has(norm(s.title))) hit++;
console.log('WE 曲目', weSongs.length, '| sdvx 8xxx 命中', hit);
