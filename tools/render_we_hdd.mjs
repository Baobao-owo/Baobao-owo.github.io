// 用 HDD 的 Music.xml 建立 WE 编号→曲名（权威），重新渲染全部 WE 预览
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const HDD = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/hdd-music.json'), 'utf8'));
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const BOT_DIR = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend/public/assets/chunithm/chart');
const HDD_ROOTS = ['D:/XVX/opt'];
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const GH = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';

function norm(t) {
  return String(t).normalize('NFKC').toLowerCase().replace(/[\s\u3000]/g, '').replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');
}

// HDD 里 WE 曲名 → id
const weByTitle = new Map();
const weByCore = new Map();
const coreOf = (t) => String(t).replace(/[\(（\[［【][^\)）\]］】]*[\)）\]］】]\s*$/g, '').trim();
for (const [id, v] of Object.entries(HDD)) {
  if (Number(id) >= 8000) {
    weByTitle.set(norm(v.title), Number(id));
    const c = norm(coreOf(v.title));
    if (c && !weByCore.has(c)) weByCore.set(c, Number(id));
  }
}
function findHddId(title) {
  const k = norm(title);
  if (weByTitle.has(k)) return weByTitle.get(k);
  const c = norm(coreOf(title));
  if (weByCore.has(c)) return weByCore.get(c);
  for (const [hk, id] of weByTitle) {
    if (hk.length > 3 && (hk.includes(k) || k.includes(hk))) return id;
  }
  return null;
}
console.log('HDD WE 条目:', weByTitle.size);

// 找 HDD 里的 c2s 文件
const CHART_INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/hdd-we-charts.json'), 'utf8'));
function findHddChart(id) {
  return CHART_INDEX[String(id)] && fs.existsSync(CHART_INDEX[String(id)]) ? CHART_INDEX[String(id)] : null;
}

// 我们这边的 WE 曲目
const queue = [];
for (const s of GUIDE.songs) {
  const isWE = (s.sheets || []).length && s.sheets.every((sh) => String(sh.difficulty).startsWith('【'));
  if (!isWE) continue;
  const mid = IDS[String(s.title).trim()];
  if (!mid) continue;
  const hddId = findHddId(s.title);
  if (!hddId) continue;
  const src = findHddChart(hddId);
  if (!src) continue;
  const dst = path.join(BOT_DIR, String(hddId) + '_05.c2s');
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
  queue.push({ mid, hddId, key: mid + '_5', title: s.title });
}
console.log('可渲染 WE:', queue.length);

// 清掉旧的 WE 预览键，避免错误映射残留
for (const k of Object.keys(manifest)) {
  if (k.endsWith('_5')) delete manifest[k];
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');

async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res.json();
}
let rel;
try {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/chuni-previews-we`);
} catch (e) {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: 'chuni-previews-we', name: 'WE 预览图', body: '自动上传' })
  });
}

// 已上传过的资产复用
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
  const assetName = String(item.hddId) + '_05.webp';
  try {
    if (existing.has(assetName)) {
      manifest[item.key] = existing.get(assetName);
      ok++;
      continue;
    }
    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${String(item.hddId)}_05`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await page.waitForSelector('.stage', { timeout: 12000 });
    const out = path.join(ROOT, '_tmp/charts', 'weh_' + assetName);
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
    console.log('fail', item.key, item.title, String(e).slice(0, 50));
  }
  if ((ok + fail) % 20 === 0) {
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
    console.log('done', ok + fail, '/', queue.length);
  }
}
await browser.close();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('WE 完成 ok=', ok, 'fail=', fail, '| 清单', Object.keys(manifest).length);
