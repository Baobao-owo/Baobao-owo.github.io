// 从本地预览图生成「清单」：哪些歌哪些难度有图，图在哪
// 用法: node tools/build_preview_manifest.mjs [--base https://你的图床前缀]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'source/assets/chuni/preview');
const OUT = path.join(ROOT, 'source/_data/chuni_previews.json');

const baseIdx = process.argv.indexOf('--base');
const base = baseIdx > 0 ? process.argv[baseIdx + 1].replace(/\/$/, '') : '';

const manifest = {};
if (fs.existsSync(DIR)) {
  for (const f of fs.readdirSync(DIR)) {
    const m = f.match(/^(\d+)_(\d+)\.(webp|png|svg)$/);
    if (!m) continue;
    const key = m[1] + '_' + m[2];
    manifest[key] = base ? `${base}/${f}` : `/assets/chuni/preview/${f}`;
  }
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1), 'utf8');
console.log('清单条目:', Object.keys(manifest).length, '| 前缀:', base || '(本地)');
