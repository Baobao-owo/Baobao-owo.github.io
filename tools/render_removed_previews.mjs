// 渲染「补录删除曲」的谱面预览图，并上传到 GitHub Release
//
// 用法：
//   node tools/render_removed_previews.mjs --dry              # 只看要渲染多少张
//   node tools/render_removed_previews.mjs --no-upload        # 只渲染到本地（不需要 token）
//   $env:GH_TOKEN="github_pat_xxx"; node tools/render_removed_previews.mjs   # 渲染并上传
//
// 脚本会自己起 vite 渲染服务（127.0.0.1:5199），跑完自动关掉，不用手动开窗口。
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');
const NO_UPLOAD = process.argv.includes('--no-upload');

const SRC = 'D:/XVX/HDD/bin/option/A300/music';
const FE = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend');
const BOT_DIR = path.join(FE, 'public/assets/chunithm/chart');
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const LOCAL_DIR = path.join(ROOT, '_tmp/charts-removed');
const LOCAL_MAP = path.join(ROOT, '_tmp/charts-removed.json');
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const REMOVED = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_removed_songs.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';
const TOKEN = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

// ---- 索引 A300 的 c2s ----
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
    if (!NO_UPLOAD && manifest[key]) continue;
    queue.push({ key, chartName, src });
  }
}

console.log('A300 c2s 索引:', index.size, '| 待渲染:', queue.length);
if (!queue.length || DRY) process.exit(0);
if (!NO_UPLOAD && !TOKEN) {
  console.error('缺少 GH_TOKEN。想先只渲染到本地可以加 --no-upload');
  process.exit(1);
}

// ---- 起渲染服务 ----
const viteBin = path.join(FE, 'node_modules/vite/bin/vite.js');
if (!fs.existsSync(viteBin)) {
  console.error('找不到 vite：' + viteBin);
  process.exit(1);
}
const server = spawn(process.execPath, [viteBin, 'serve', '--host', '127.0.0.1', '--port', '5199', '--strictPort'], {
  cwd: FE,
  stdio: 'ignore',
});

async function waitServer() {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch('http://127.0.0.1:5199/', { method: 'HEAD' });
      return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
if (!(await waitServer())) {
  console.error('渲染服务没起来（5199 端口）');
  server.kill();
  process.exit(1);
}
console.log('渲染服务已就绪');

// ---- Release（仅上传模式）----
let rel = null;
let existing = new Map();
async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url + ' ' + (await res.text()).slice(0, 120));
  return res.json();
}
if (!NO_UPLOAD) {
  try {
    rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`);
  } catch (e) {
    rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_name: PREFIX, name: '补充预览图（删除曲）', body: '自动上传' }),
    });
  }
  for (let p = 1; p <= 20; p++) {
    const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?per_page=100&page=${p}`);
    if (!arr.length) break;
    arr.forEach((a) => existing.set(a.name, a.browser_download_url));
    if (arr.length < 100) break;
  }
  console.log('release 里已有附件:', existing.size);
}

fs.mkdirSync(BOT_DIR, { recursive: true });
if (NO_UPLOAD) fs.mkdirSync(LOCAL_DIR, { recursive: true });
const localMap = NO_UPLOAD && fs.existsSync(LOCAL_MAP) ? JSON.parse(fs.readFileSync(LOCAL_MAP, 'utf8')) : {};

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
    const c2s = path.join(BOT_DIR, item.chartName + '.c2s');
    if (!fs.existsSync(c2s)) fs.copyFileSync(item.src, c2s);

    if (NO_UPLOAD) {
      const dst = path.join(LOCAL_DIR, assetName);
      if (fs.existsSync(dst)) {
        localMap[item.key] = dst;
        ok++;
        continue;
      }
    } else if (existing.has(assetName)) {
      manifest[item.key] = existing.get(assetName);
      ok++;
      continue;
    }

    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${item.chartName}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForSelector('.stage', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2500));

    if (NO_UPLOAD) {
      const dst = path.join(LOCAL_DIR, assetName);
      await page.screenshot({ path: dst, fullPage: true, type: 'webp', quality: 82 });
      localMap[item.key] = dst;
    } else {
      const tmp = path.join(ROOT, '_tmp/charts', 'rm_' + assetName);
      fs.mkdirSync(path.dirname(tmp), { recursive: true });
      await page.screenshot({ path: tmp, fullPage: true, type: 'webp', quality: 82 });
      const buf = fs.readFileSync(tmp);
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
      fs.unlinkSync(tmp);
    }
    ok++;
    if (ok % 20 === 0) console.log('进度', ok + '/' + queue.length);
  } catch (e) {
    fail++;
    console.log('fail', item.key, String(e).slice(0, 60));
  }
}
await browser.close();
server.kill();
if (NO_UPLOAD) {
  fs.writeFileSync(LOCAL_MAP, JSON.stringify(localMap, null, 1), 'utf8');
  console.log('本地渲染完成 ok=' + ok, 'fail=' + fail, '| 文件在', LOCAL_DIR);
} else {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
  console.log('完成 ok=' + ok, 'fail=' + fail, '| 清单条目', Object.keys(manifest).length);
}
