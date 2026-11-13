// 把已经渲染好的本地预览图（_tmp/charts-removed）上传到 GitHub Release，并更新清单
// 用法：$env:GH_TOKEN="github_pat_xxx"; node tools/upload_removed_previews.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCAL_DIR = path.join(ROOT, '_tmp/charts-removed');
const LOCAL_MAP = path.join(ROOT, '_tmp/charts-removed.json');
const MANIFEST = path.join(ROOT, 'source/_data/chuni_previews.json');

const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';
const TOKEN = process.env.GH_TOKEN || '';
const HEADERS = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

if (!TOKEN) {
  console.error('缺少 GH_TOKEN');
  process.exit(1);
}
if (!fs.existsSync(LOCAL_DIR)) {
  console.error('没有本地预览图：' + LOCAL_DIR);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const files = fs.readdirSync(LOCAL_DIR).filter((f) => /^\d+_\d+\.webp$/.test(f));
console.log('本地待上传:', files.length);

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

let ok = 0;
let fail = 0;
for (const f of files) {
  // 文件名是 4 位补零（0000_00），清单里的 key 是不补零（0_0）
  const key = f
    .replace(/\.webp$/, '')
    .split('_')
    .map((x) => String(Number(x)))
    .join('_');
  try {
    if (existing.has(f)) {
      manifest[key] = existing.get(f);
      ok++;
      continue;
    }
    const buf = fs.readFileSync(path.join(LOCAL_DIR, f));
    const res = await fetch(
      `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${encodeURIComponent(f)}`,
      {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
        body: buf,
      }
    );
    if (!res.ok) throw new Error('upload ' + res.status);
    const j = await res.json();
    manifest[key] = j.browser_download_url;
    existing.set(f, j.browser_download_url);
    ok++;
    if (ok % 20 === 0) console.log('进度', ok + '/' + files.length);
  } catch (e) {
    fail++;
    console.log('fail', f, String(e).slice(0, 60));
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('上传完成 ok=' + ok, 'fail=' + fail, '| 清单条目', Object.keys(manifest).length);
