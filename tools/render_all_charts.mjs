// 全量生成平面谱面预览：用 MarisaBot 前端渲染 → 截图 WebP → 上传 Release 附件 → 写清单
// 用法: node tools/render_all_charts.mjs [--limit N] [--sleep 200]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const TMP = path.join(ROOT, '_tmp/charts');
const LOG = path.join(ROOT, '_tmp/chart-render.log');
fs.mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 ? args[i + 1] || d : d;
};
const LIMIT = Number(opt('limit', '0')) || 0;
const SLEEP = Number(opt('sleep', '200'));

const GH = process.env.GH_TOKEN || '';
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const TAG_PREFIX = 'chuni-previews';
const SHARD = 800;
const HEADERS = { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
} catch (e) {}

// ---- Release 分片/附件管理 ----
async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
async function listReleases() {
  const all = [];
  for (let p = 1; p <= 20; p++) {
    const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100&page=${p}`);
    if (!arr.length) break;
    all.push(...arr);
    if (arr.length < 100) break;
  }
  return all.filter((r) => r.tag_name.startsWith(TAG_PREFIX)).sort((a, b) => a.tag_name.localeCompare(b.tag_name));
}
async function listAssets(id) {
  const map = new Map();
  for (let p = 1; p <= 20; p++) {
    const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${id}/assets?per_page=100&page=${p}`);
    if (!arr.length) break;
    arr.forEach((a) => map.set(a.name, a.browser_download_url));
    if (arr.length < 100) break;
  }
  return map;
}
async function createRelease(tag) {
  return api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: tag, name: `CHUNITHM 谱面预览图 ${tag.replace(TAG_PREFIX + '-', '')}`, body: '自动上传' })
  });
}

const releases = await listReleases();
const assetsByRelease = new Map();
for (const r of releases) assetsByRelease.set(r.id, await listAssets(r.id));
const known = new Map();
for (const [, m] of assetsByRelease) for (const [n, u] of m) known.set(n, u);
console.log('release 分片:', releases.length, '已有附件:', known.size);

let current = releases.length ? releases[releases.length - 1] : null;
let currentCount = current ? (assetsByRelease.get(current.id) || new Map()).size : 0;

async function upload(file, name) {
  if (known.has(name)) return known.get(name);
  if (!current || currentCount >= SHARD) {
    const tag = `${TAG_PREFIX}-${String(releases.length + 1).padStart(2, '0')}`;
    current = await createRelease(tag);
    releases.push(current);
    currentCount = 0;
    console.log('新建 release:', tag);
  }
  const buf = fs.readFileSync(file);
  const res = await fetch(`https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${current.id}/assets?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
    body: buf
  });
  if (!res.ok) throw new Error('upload ' + res.status);
  const j = await res.json();
  known.set(name, j.browser_download_url);
  currentCount++;
  return j.browser_download_url;
}

// ---- 队列 ----
const queue = [];
for (const s of GUIDE.songs) {
  const mid = IDS[String(s.title).trim()];
  if (!mid) continue;
  const sheets = s.sheets || [];
  for (let i = 0; i < sheets.length; i++) {
    if (String(sheets[i].difficulty).startsWith('【')) continue; // WE 暂不渲染
    const key = `${mid}_${i}`;
    if (manifest[key] && /^https/.test(manifest[key])) continue;
    queue.push({ mid, i, key, title: s.title });
  }
}
console.log('待渲染:', queue.length, '| 已有清单:', Object.keys(manifest).length);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});
let page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 1 });

let ok = 0;
let fail = 0;
let done = 0;
let browserRestart = 0;

for (const item of queue) {
  if (LIMIT && done >= LIMIT) break;
  done++;
  const name = `${String(item.mid).padStart(4, '0')}_${String(item.i).padStart(2, '0')}.webp`;
  const key = `${item.mid}_${item.i}`;
  try {
    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${String(item.mid).padStart(4, '0')}_${String(item.i).padStart(2, '0')}`, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });
    await page.waitForSelector('.stage', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    const out = path.join(TMP, name);
    await page.screenshot({ path: out, fullPage: true, type: 'webp', quality: 82 });
    const url = await upload(out, name);
    manifest[key] = url;
    fs.unlinkSync(out);
    ok++;
  } catch (e) {
    fail++;
    fs.appendFileSync(LOG, JSON.stringify({ key: item.key, title: item.title, err: String(e).slice(0, 120) }) + '\n', 'utf8');
  }
  if (done % 20 === 0) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
    console.log(`done=${done} ok=${ok} fail=${fail} 剩余=${queue.length - done}`);
  }
  if (done % 300 === 0) {
    // 定期重启浏览器，防内存泄漏
    try { await page.close(); await browser.close(); } catch (e) {}
    const b2 = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
    });
    page = await b2.newPage();
    await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 1 });
    browserRestart++;
  }
  await new Promise((r) => setTimeout(r, SLEEP));
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
try { await browser.close(); } catch (e) {}
console.log('完成 ok=', ok, 'fail=', fail, '| 清单', Object.keys(manifest).length);
