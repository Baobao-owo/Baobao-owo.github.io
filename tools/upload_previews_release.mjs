// 把预览图传到 GitHub Release 附件（不占仓库体积、不进 Pages 配额），并写清单
// 用法:
//   node tools/upload_previews_release.mjs --only 710
//   node tools/upload_previews_release.mjs            # 全部本地图
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'source/assets/chuni/preview');
const OUT = path.join(ROOT, 'source/_data/chuni_previews.json');
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const TAG = 'chuni-previews';
const TOKEN = process.env.GH_TOKEN || '';

const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1] : '';

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'dsh-blog'
};

async function ensureRelease() {
  const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`;
  let res = await fetch(getUrl, { headers });
  if (res.ok) return res.json();
  const create = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: TAG,
      name: 'CHUNITHM 谱面预览图',
      body: '站点里曲目页的平面图（自动上传，勿手改）'
    })
  });
  if (!create.ok) throw new Error('建 release 失败 ' + create.status + ' ' + (await create.text()).slice(0, 120));
  return create.json();
}

async function listAssets(releaseId) {
  const map = new Map();
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?per_page=100&page=${page}`, { headers });
    if (!res.ok) break;
    const arr = await res.json();
    if (!arr.length) break;
    arr.forEach((a) => map.set(a.name, a.browser_download_url));
    if (arr.length < 100) break;
  }
  return map;
}

const release = await ensureRelease();
const existing = await listAssets(release.id);
console.log('release:', release.tag_name, '已有附件:', existing.size);

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(OUT, 'utf8'));
} catch (e) {}

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /\.(webp|png)$/i.test(f)) : [];
let uploaded = 0;
let reused = 0;

for (const f of files) {
  const m = f.match(/^(\d+)_(\d+)\.(webp|png)$/);
  if (!m) continue;
  if (only && m[1] !== only) continue;
  const key = m[1] + '_' + m[2];

  if (existing.has(f)) {
    manifest[key] = existing.get(f);
    reused++;
    continue;
  }

  const buf = fs.readFileSync(path.join(DIR, f));
  const url = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${release.id}/assets?name=${encodeURIComponent(f)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': f.endsWith('.webp') ? 'image/webp' : 'image/png',
      'Content-Length': String(buf.length)
    },
    body: buf
  });
  if (!res.ok) {
    console.log('上传失败', f, res.status, (await res.text()).slice(0, 100));
    continue;
  }
  const j = await res.json();
  manifest[key] = j.browser_download_url;
  uploaded++;
  console.log('ok', f, '→', j.browser_download_url);
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1), 'utf8');
console.log('上传:', uploaded, '复用:', reused, '| 清单:', Object.keys(manifest).length);
