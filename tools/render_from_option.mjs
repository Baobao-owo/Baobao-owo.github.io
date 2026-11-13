// 用 D:\QQ\Downloads\option (1) 里的 c2s 补渲染缺失谱面（普通 + WE）
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const HDD = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/hdd-music.json'), 'utf8'));
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const BOT_DIR = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend/public/assets/chunithm/chart');
const SRC = 'D:/QQ/Downloads/option (1)';
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

// 索引 option 目录里的 c2s
const index = new Map(); // `${id}_${diff}` -> path
(function walk(dir, depth) {
  if (depth > 5) return;
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
console.log('option 里 c2s 索引:', index.size);

function norm(t) {
  return String(t).normalize('NFKC').toLowerCase().replace(/[\s\u3000]/g, '').replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');
}

// 我们这边 WE 曲名 → HDD 8xxx 编号
const weById = new Map();
for (const [id, v] of Object.entries(HDD)) {
  if (Number(id) >= 8000) weById.set(norm(v.title), Number(id));
}

const queue = [];
for (const s of GUIDE.songs) {
  const mid = IDS[String(s.title).trim()];
  if (!mid) continue;
  const isWE = (s.sheets || []).length && s.sheets.every((sh) => String(sh.difficulty).startsWith('【'));
  if (isWE) {
    const key = mid + '_5';
    if (manifest[key]) continue;
    const hddId = weById.get(norm(s.title));
    if (!hddId) continue;
    const src = index.get(String(hddId) + '_05');
    if (!src) continue;
    queue.push({ mid, chartName: String(hddId).padStart(4, '0') + '_05', key, src, we: true });
    continue;
  }
  for (let i = 0; i < (s.sheets || []).length; i++) {
    if (String(s.sheets[i].difficulty).startsWith('【')) continue;
    const key = mid + '_' + i;
    if (manifest[key]) continue;
    const src = index.get(String(mid) + '_' + String(i).padStart(2, '0'));
    if (!src) continue;
    queue.push({ mid, chartName: String(mid).padStart(4, '0') + '_' + String(i).padStart(2, '0'), key, src, we: false });
  }
}
console.log('可补渲染:', queue.length);
if (!queue.length) process.exit(0);

const GH = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';

async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res.json();
}
let rel;
try {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`);
} catch (e) {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: PREFIX, name: '补充预览图', body: '自动上传' })
  });
}
const existing = new Map();
for (let p = 1; p <= 20; p++) {
  const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?per_page=100&page=${p}`);
  if (!arr.length) break;
  arr.forEach((a) => existing.set(a.name, a.browser_download_url));
  if (arr.length < 100) break;
}

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
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
    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${item.chartName}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('.stage', { timeout: 12000 });
    const out = path.join(ROOT, '_tmp/charts', 'opt_' + assetName);
    await page.screenshot({ path: out, fullPage: true, type: 'webp', quality: 82 });
    const buf = fs.readFileSync(out);
    const res = await fetch(`https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(assetName)}`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
      body: buf
    });
    if (!res.ok) throw new Error('upload ' + res.status);
    const j = await res.json();
    manifest[item.key] = j.browser_download_url;
    fs.unlinkSync(out);
    ok++;
  } catch (e) {
    fail++;
    console.log('fail', item.key, String(e).slice(0, 50));
  }
}
await browser.close();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('补渲染完成 ok=', ok, 'fail=', fail, '| 清单', Object.keys(manifest).length);
