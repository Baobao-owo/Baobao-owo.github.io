// 补渲染：只处理「清单缺失且源 c2s 存在」的谱面
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8').replace(/^\uFEFF/, ''));
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');
const DIR = path.join(ROOT, '_tmp/marisa/repo/Marisa.Frontend/public/assets/chunithm/chart');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const GH = process.env.GH_TOKEN || '';
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-retry';
const HEADERS = { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

const queue = [];
for (const s of GUIDE.songs) {
  const mid = IDS[String(s.title).trim()];
  if (!mid) continue;
  (s.sheets || []).forEach((sh, i) => {
    if (String(sh.difficulty).startsWith('【')) return;
    const key = mid + '_' + i;
    if (manifest[key]) return;
    const f = String(mid).padStart(4, '0') + '_' + String(i).padStart(2, '0') + '.c2s';
    if (fs.existsSync(path.join(DIR, f))) queue.push({ mid, i, key });
  });
}
console.log('可补渲染:', queue.length);
if (!queue.length) process.exit(0);

// 用一个 retry 分片
async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init && init.headers) } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return res.json();
}
let rel = null;
try {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`);
} catch (e) {
  rel = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: PREFIX, name: '补渲染预览图', body: '自动上传' })
  });
}

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars']
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 1 });

let ok = 0;
for (const item of queue) {
  const name = `${String(item.mid).padStart(4, '0')}_${String(item.i).padStart(2, '0')}.webp`;
  try {
    await page.goto(`http://127.0.0.1:5199/chunithm/preview?name=${name.replace('.webp', '')}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });
    await page.waitForSelector('.stage', { timeout: 12000 });
    const out = path.join(ROOT, '_tmp/charts', name);
    await page.screenshot({ path: out, fullPage: true, type: 'webp', quality: 82 });
    const buf = fs.readFileSync(out);
    const res = await fetch(`https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
      body: buf
    });
    if (!res.ok) throw new Error('upload ' + res.status);
    const j = await res.json();
    manifest[item.key] = j.browser_download_url;
    fs.unlinkSync(out);
    ok++;
    console.log('ok', item.key);
  } catch (e) {
    console.log('fail', item.key, String(e).slice(0, 60));
  }
}
await browser.close();
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('补渲染完成 ok=', ok, '| 清单', Object.keys(manifest).length);
