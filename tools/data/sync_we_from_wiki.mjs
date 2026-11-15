// 从 wiki 的 WORLD'S END 页面同步 WE 谱面的 属性 / 星数 / 谱师
// 用法：node tools/data/sync_we_from_wiki.mjs [--write]
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const WRITE = process.argv.includes('--write');
const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
await page.goto('https://wikiwiki.jp/chunithmwiki/' + encodeURI("WORLD'S END"), { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 800));

const rows = await page.evaluate(() => {
  const out = [];
  for (const table of Array.from(document.querySelectorAll('table'))) {
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const tds = Array.from(tr.querySelectorAll('td')).map((td) => td.innerText.replace(/\s+/g, ' ').trim());
      if (tds.length !== 4) continue;
      const [title, attr, star, designerRaw] = tds;
      if (!title || title === '楽曲') continue;
      if (!/^☆[1-5]$/.test(star)) continue;
      const designer = designerRaw.replace(/\*\d+\s*$/, '').trim();
      out.push({ title, attr, stars: Number(star.slice(1)), designer });
    }
  }
  return out;
});
await browser.close();

fs.mkdirSync('_tmp/wiki', { recursive: true });
fs.writeFileSync('_tmp/wiki/worldsend-table.json', JSON.stringify(rows, null, 1), 'utf8');

const norm = (t) => String(t).normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const wiki = new Map();
for (const r of rows) if (!wiki.has(norm(r.title))) wiki.set(norm(r.title), r);

const wePath = 'source/_data/chuni_we.json';
const we = JSON.parse(fs.readFileSync(wePath, 'utf8'));
if (!we.songs) we.songs = {};
const weByNorm = new Map(Object.keys(we.songs).map((t) => [norm(t), t]));

const report = [];
for (const [n, r] of wiki) {
  const curKey = weByNorm.get(n);
  if (!curKey) {
    report.push({ action: 'add', title: r.title, attr: r.attr, stars: r.stars, designer: r.designer, note: '' });
    continue;
  }
  const cur = we.songs[curKey];
  const diffs = [];
  if (cur.attr && cur.attr !== r.attr) diffs.push(`属性 ${cur.attr}/${r.attr}`);
  if (cur.stars && Number(cur.stars) !== r.stars) diffs.push(`星 ${cur.stars}/${r.stars}`);
  const loose = (x) => String(x).normalize('NFKC').replace(/[!?！？….,，。\s*]+/g, '');
  const looseCase = (x) => loose(x).toLowerCase();
  if (cur.designer && looseCase(cur.designer) !== looseCase(r.designer)) diffs.push(`谱师 ${cur.designer}/${r.designer}`);
  if (diffs.length) report.push({ action: 'conflict', title: curKey, attr: r.attr, stars: r.stars, designer: r.designer, note: diffs.join('; ') });
  else if (!cur.designer || !cur.stars || !cur.attr) report.push({ action: 'fill', title: curKey, attr: r.attr, stars: r.stars, designer: r.designer, note: '' });
}

const counts = report.reduce((m, r) => ((m[r.action] = (m[r.action] || 0) + 1), m), {});
console.log('wiki 行数', rows.length, '唯一曲名', wiki.size, '动作', JSON.stringify(counts));

if (WRITE) {
  for (const r of report) {
    if (r.action === 'conflict') continue; // 冲突留给人工决策
    const t = r.title;
    const prev = we.songs[t] || {};
    we.songs[t] = {
      attr: prev.attr || r.attr,
      stars: prev.stars || r.stars,
      designer: prev.designer || r.designer,
    };
  }
  we.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(wePath, JSON.stringify(we), 'utf8');
}

fs.mkdirSync('_tmp/reports', { recursive: true });
const head = ['action', 'title', 'attr', 'stars', 'designer', 'note'];
fs.writeFileSync(
  '_tmp/reports/we-wiki-sync.tsv',
  [head.join('\t')].concat(report.map((r) => head.map((k) => String(r[k] ?? '').replace(/\t/g, ' ')).join('\t'))).join('\n'),
  'utf8'
);
console.log('写回', WRITE ? '是' : '否（加 --write）');
