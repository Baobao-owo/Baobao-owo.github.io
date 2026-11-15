// 把 release 上已存在的附件回填进预览清单（用于上传丢回执的情况）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LOCAL_DIR = path.join(ROOT, '_tmp/charts-removed');
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

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const files = fs.readdirSync(LOCAL_DIR).filter((f) => /^\d+_\d+\.webp$/.test(f));

const rel = await (await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`, { headers: HEADERS })).json();
const existing = new Map();
for (let p = 1; p <= 20; p++) {
  const arr = await (
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?per_page=100&page=${p}`, { headers: HEADERS })
  ).json();
  if (!Array.isArray(arr) || !arr.length) break;
  arr.forEach((a) => existing.set(a.name, a.browser_download_url));
  if (arr.length < 100) break;
}
console.log('release 附件总数:', existing.size, '| 本地文件:', files.length);

let filled = 0;
const missing = [];
for (const f of files) {
  const key = f.replace(/\.webp$/, '').split('_').map((x) => String(Number(x))).join('_');
  if (manifest[key]) continue;
  if (existing.has(f)) {
    manifest[key] = existing.get(f);
    filled++;
  } else {
    missing.push(f);
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1), 'utf8');
console.log('回填:', filled, '| 仍缺:', missing.length, '| 清单条目:', Object.keys(manifest).length);
missing.slice(0, 10).forEach((m) => console.log('  ' + m));
