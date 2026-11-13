// 渲染「补录删除曲」的谱面预览图，并上传到 GitHub Release（需要 GH_TOKEN）
//
// 前置：先另开一个窗口起渲染服务
//   cd _tmp\marisa\repo\Marisa.Frontend
//   npx vite serve --host 127.0.0.1 --port 5199
//
// 运行：
//   $env:GH_TOKEN = "你的 token"
//   node tools/render_removed_previews.mjs [--dry]
//
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');

const SRC = 'D:/XVX/HDD/bin/option/A300/music';
const BOT_DIR = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend/public/assets/chunithm/chart');
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const REMOVED = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_removed_songs.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';
const TOKEN = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

// 索引 A300 里的 c2s：0000_00.c2s
const index = new Map();
(function walk(dir, depth) {
  if (depth > 4) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else {
      const m = e.name.match(/^(\d+)_(\d{2})\.c2s$/);
      if (m) index.set(m[1] + '_' + m[2], p);
    }
  }
})(SRC, 0);
console.log('A300 c2s 索引:', index.size);

const DIFF_IDX = ['basic', 'advanced', 'expert', 'master', 'ultima'];
const queue = [];
for (const s of REMOVED) {
  const id = IDS[s.title];
  if (id === undefined) continue;
  const mid = String(id);
  const sheets = s.sheets || [];
  for (let i = 0; i < sheets.length && i < 5; i++) {
    const d = String(sheets[i].difficulty || '').toLowerCase();
    if (DIFF_IDX[i] !== d) continue;
    const chartName = mid.padStart(4, '0') + '_' + String(i).padStart(2, '0');
    const src = index.get(chartName);
    if (!src) continue;
    const key = mid + '_' + i;
    if (manifest[key]) continue;
    queue.push({ key, chartName, src });
  }
}

const byDiff = {};
queue.forEach((q) => {
  const i = q.key.split('_')[1];
  byDiff[i] = (byDiff[i] || 0) + 1;
});
console.log('待渲染:', queue.length, '| 按难度:', JSON.stringify(byDiff));
if (!queue.length) process.exit(0);
if (DRY) process.exit(0);
if (!TOKEN) {
  console.error('缺少 GH_TOKEN：先 set/export 一个带 repo 权限的 token 再跑');
  process.exit(1);
}

async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url + ' ' + (await res.text()).slice(0, 120));
  return res.json();
}

let rel;
try {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`);
} catch (e) {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: PREFIX, name: '补充预览图（删除曲）', body: '自动上传' }),
  });
}
const existing = new Map();
for (let p = 1; p <= 20; p++) {
  const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?per_page=100&page=${p}`);
  if (!arr.length) break;
  arr.forEach((a) => existing.set(a.name, a.browser_download_url));
  if (arr.length < 100) break;
}
console.log('release 里已有附件:', existing.size);

fs.mkdirSync(BOT_DIR, { recursive: true });
fs.mkdirSync(path.join(ROOT, '_tmp/charts'), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 1 });

let ok = 0;
let fail = 0;
for (const item of queue) {
  const assetName = item.chartName + '.webp';
  try {
    const dst = path.join(BOT_DIR, item.chartName + '.c2s');
    if (!fs.existsSync(dst)) fs.copyFileSync(item.src, dst);
    if (existing.has(assetName)) {
      manifest[item.key] = existing.get(assetName);
      ok++;
      continue;
    }
    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${item.chartName}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForSelector('.stage', { timeout: 15000 });
    const out = path.join(ROOT, '_tmp/charts', 'rm_' + assetName);
    await page.screenshot({ path: out, fullPage: true, type: 'webp', quality: 82 });
    const buf = fs.readFileSync(out);
    const res = await fetch(
      `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(assetName)}`,
      {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
        body: buf,
      }
    );
    if (!res.ok) throw new Error('upload ' + res.status);
    const j = await res.json();
    manifest[item.key] = j.browser_download_url;
    existing.set(assetName, j.browser_download_url);
    fs.unlinkSync(out);
    ok++;
    if (ok % 20 === 0) console.log('进度', ok + '/' + queue.length);
  } catch (e) {
    fail++;
    console.log('fail', item.key, String(e).slice(0, 60));
  }
}
await browser.close();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('完成 ok=' + ok, 'fail=' + fail, '| 清单条目', Object.keys(manifest).length);
