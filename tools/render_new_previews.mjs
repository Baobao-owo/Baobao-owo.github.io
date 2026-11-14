// 渲染指定目录里的新谱面预览图并上传到 Release（用于 A093 / AKOP 这类增量包）
// 用法：$env:GH_TOKEN="..." ; node tools/render_new_previews.mjs "D:/.../A093" "D:/.../AKOP"
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const DIRS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!DIRS.length) {
  console.error('用法: node tools/render_new_previews.mjs <目录1> <目录2>');
  process.exit(1);
}

const FE = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend');
const BOT_DIR = path.join(FE, 'public/assets/chunithm/chart');
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';
const TOKEN = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

// 收集 c2s
const files = [];
for (const d of DIRS) {
  if (!fs.existsSync(d)) { console.log('跳过不存在的目录:', d); continue; }
  (function walk(p) {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const q = path.join(p, e.name);
      if (e.isDirectory()) walk(q);
      else {
        const m = e.name.match(/^(\d+)_(\d{2})\.c2s$/i);
        if (m) files.push({ chartName: String(m[1]).padStart(4, '0') + '_' + m[2], src: q, key: String(Number(m[1])) + '_' + String(Number(m[2])) });
      }
    }
  })(d);
}

const queue = files.filter((f) => !manifest[f.key]);
console.log('c2s:', files.length, '| 待渲染:', queue.length);
if (!queue.length) process.exit(0);
if (!TOKEN) { console.error('缺少 GH_TOKEN'); process.exit(1); }

// 起渲染服务
const viteBin = path.join(FE, 'node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteBin, 'serve', '--host', '127.0.0.1', '--port', '5199', '--strictPort'], { cwd: FE, stdio: 'ignore' });
async function waitServer() {
  for (let i = 0; i < 40; i++) {
    try { await fetch('http://127.0.0.1:5199/', { method: 'HEAD' }); return true; } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
if (!(await waitServer())) { console.error('渲染服务没起来'); server.kill(); process.exit(1); }
console.log('渲染服务就绪');

async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url + ' ' + (await res.text()).slice(0, 100));
  return res.json();
}

let rel;
try {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`);
} catch (e) {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: PREFIX, name: '补充预览图', body: '自动上传' }),
  });
}
const existing = new Map();
for (let p = 1; p <= 20; p++) {
  const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?per_page=100&page=${p}`);
  if (!arr.length) break;
  arr.forEach((a) => existing.set(a.name, a.browser_download_url));
  if (arr.length < 100) break;
}
console.log('release 已有附件:', existing.size);

fs.mkdirSync(BOT_DIR, { recursive: true });
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
    if (existing.has(assetName)) { manifest[item.key] = existing.get(assetName); ok++; continue; }

    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${item.chartName}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('.stage', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));
    const out = path.join(ROOT, '_tmp/charts', 'new_' + assetName);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: true, type: 'webp', quality: 82 });
    const buf = fs.readFileSync(out);
    const res = await fetch(`https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(assetName)}`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
      body: buf,
    });
    if (!res.ok) throw new Error('upload ' + res.status);
    const j = await res.json();
    manifest[item.key] = j.browser_download_url;
    existing.set(assetName, j.browser_download_url);
    fs.unlinkSync(out);
    ok++;
    console.log('ok', item.key, '->', j.browser_download_url);
  } catch (e) {
    fail++;
    console.log('fail', item.key, String(e).slice(0, 80));
  }
}
await browser.close();
server.kill();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('完成 ok=' + ok, 'fail=' + fail, '| 清单条目', Object.keys(manifest).length);
