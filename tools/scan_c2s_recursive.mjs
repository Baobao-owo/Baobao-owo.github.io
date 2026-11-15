#!/usr/bin/env node
// 递归扫描两个 HDD 里所有 c2s，和预览清单比对。
// 目的：以后别再「只看平铺 music 目录就断定文件不存在」。
// 用法: node tools/scan_c2s_recursive.mjs [--report=_tmp/reports/c2s-scan.tsv]
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['D:\\SDHD - CHUNITHM Mate', 'D:\\XVX'];
const reportArg = process.argv.find((a) => a.startsWith('--report='));
const REPORT = reportArg ? reportArg.split('=')[1] : '_tmp/reports/c2s-scan.tsv';

const previews = JSON.parse(fs.readFileSync('source/_data/chuni_previews.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8'));
const removedRaw = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));
const removedSongs = removedRaw.songs || removedRaw.removed || [];

// musicId → 曲名（chuni_ids.json 是 曲名 → musicId）
const titleByMid = new Map();
for (const [title, mid] of Object.entries(ids)) {
  const n = Number(mid);
  if (Number.isFinite(n) && n > 0 && !titleByMid.has(n)) titleByMid.set(n, title);
}
for (const s of removedSongs) {
  const n = Number(s.musicId || 0);
  if (Number.isFinite(n) && n > 0 && !titleByMid.has(n)) titleByMid.set(n, s.title || s.t || '');
}

const found = new Map();

function walk(dir, depth = 0) {
  if (depth > 14) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, depth + 1);
      continue;
    }
    const m = /^(\d+)_(\d{1,2})\.c2s$/i.exec(e.name);
    if (!m) continue;
    const key = `${Number(m[1])}_${Number(m[2])}`;
    if (!found.has(key)) found.set(key, []);
    found.get(key).push(full);
  }
}

for (const root of ROOTS) walk(root);

const rows = [];
for (const [key, paths] of found) {
  const [mid, diff] = key.split('_').map(Number);
  rows.push({
    key,
    mid,
    diff,
    title: titleByMid.get(mid) || '',
    havePreview: Boolean(previews[key]),
    path: paths[0],
  });
}

const missingLocal = rows.filter((r) => !r.havePreview && r.title);
const knownPreview = rows.filter((r) => r.havePreview).length;

fs.mkdirSync(path.dirname(REPORT), { recursive: true });
const lines = ['key\tmusicId\tdiff\ttitle\tpreview\tpath'];
for (const r of rows.sort((a, b) => a.mid - b.mid || a.diff - b.diff)) {
  lines.push(`${r.key}\t${r.mid}\t${r.diff}\t${r.title}\t${r.havePreview ? 1 : 0}\t${r.path}`);
}
fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');

console.log(`扫描根: ${ROOTS.join(' | ')}`);
console.log(`本地 c2s 唯一键: ${found.size}`);
console.log(`清单已有: ${Object.keys(previews).length}（本地命中 ${knownPreview}）`);
console.log(`清单缺、但本地有 c2s（可渲染）: ${missingLocal.length}`);
for (const r of missingLocal) console.log(`  ${r.key}\t${r.title}\t${r.path}`);
console.log(`明细: ${REPORT}`);
