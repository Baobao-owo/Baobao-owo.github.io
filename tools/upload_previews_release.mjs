// 把预览图传到 GitHub Release 附件（自动分片：单个 release 最多 1000 附件，我们默认 800 一片）
// 用法:
//   node tools/upload_previews_release.mjs                 # 全部本地图
//   node tools/upload_previews_release.mjs --only 710
//   node tools/upload_previews_release.mjs --shard 800
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'source/assets/chuni/preview');
const OUT = path.join(ROOT, 'source/_data/chuni_previews.json');
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const TAG_PREFIX = 'chuni-previews';
const TOKEN = process.env.GH_TOKEN || '';

const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1] : '';
const shardIdx = process.argv.indexOf('--shard');
const SHARD = shardIdx > 0 ? Number(process.argv[shardIdx + 1]) || 800 : 800;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'dsh-blog'
};

async function api(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init && init.headers) } });
  if (!res.ok) throw new Error(`${res.status} ${url} ${(await res.text()).slice(0, 120)}`);
  return res.json();
}

async function listReleases() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100&page=${page}`);
    if (!arr.length) break;
    all.push(...arr);
    if (arr.length < 100) break;
  }
  return all.filter((r) => r.tag_name.startsWith(TAG_PREFIX)).sort((a, b) => a.tag_name.localeCompare(b.tag_name));
}

async function listAssets(releaseId) {
  const map = new Map();
  for (let page = 1; page <= 20; page++) {
    const arr = await api(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${releaseId}/assets?per_page=100&page=${page}`);
    if (!arr.length) break;
    arr.forEach((a) => map.set(a.name, { url: a.browser_download_url, size: a.size }));
    if (arr.length < 100) break;
  }
  return map;
}

async function createRelease(tag) {
  return api(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tag_name: tag,
      name: `CHUNITHM 谱面预览图 ${tag.replace(TAG_PREFIX + '-', '')}`,
      body: '站点里曲目页的平面图（自动上传，勿手改）'
    })
  });
}

const releases = await listReleases();
console.log('已有 release:', releases.map((r) => r.tag_name).join(', ') || '(无)');

// 收集已有附件
const assetsByRelease = new Map();
for (const r of releases) {
  assetsByRelease.set(r.id, await listAssets(r.id));
}
const known = new Map();
for (const [, map] of assetsByRelease) {
  for (const [name, info] of map) known.set(name, info.url);
}

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(OUT, 'utf8'));
} catch (e) {}

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /\.(webp|png)$/i.test(f)) : [];
const todo = [];
for (const f of files) {
  const m = f.match(/^(\d+)_(\d+)\.(webp|png)$/);
  if (!m) continue;
  if (only && m[1] !== only) continue;
  const key = m[1] + '_' + m[2];
  if (known.has(f)) {
    manifest[key] = known.get(f);
    continue;
  }
  todo.push({ file: f, key });
}

console.log('本地待上传:', todo.length, '| 已有附件:', known.size);

let uploaded = 0;
let current = releases.length ? releases[releases.length - 1] : null;
let currentCount = current ? (assetsByRelease.get(current.id) || new Map()).size : 0;

for (const item of todo) {
  if (!current || currentCount >= SHARD) {
    const n = releases.length + 1;
    const tag = `${TAG_PREFIX}-${String(n).padStart(2, '0')}`;
    current = await createRelease(tag);
    releases.push(current);
    currentCount = 0;
    console.log('新建 release:', tag);
  }
  const buf = fs.readFileSync(path.join(DIR, item.file));
  const url = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${current.id}/assets?name=${encodeURIComponent(item.file)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': item.file.endsWith('.webp') ? 'image/webp' : 'image/png',
      'Content-Length': String(buf.length)
    },
    body: buf
  });
  if (!res.ok) {
    console.log('上传失败', item.file, res.status, (await res.text()).slice(0, 80));
    continue;
  }
  const j = await res.json();
  manifest[item.key] = j.browser_download_url;
  uploaded++;
  currentCount++;
  if (uploaded % 20 === 0) console.log(`… 已上传 ${uploaded}`);
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1), 'utf8');
console.log('上传:', uploaded, '| 清单:', Object.keys(manifest).length, '| release 数:', releases.length);
