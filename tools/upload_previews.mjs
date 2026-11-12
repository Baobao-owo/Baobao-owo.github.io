// 把本地预览图传到外部图床（默认 catbox.moe，免注册），再把清单写成远程 URL
// 用法: node tools/upload_previews.mjs [--only 710] [--dry]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'source/assets/chuni/preview');
const OUT = path.join(ROOT, 'source/_data/chuni_previews.json');
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1] : '';
const dry = process.argv.includes('--dry');

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(OUT, 'utf8'));
} catch (e) {}

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /\.(webp|png)$/i.test(f)) : [];
let uploaded = 0;
let skipped = 0;

for (const f of files) {
  const m = f.match(/^(\d+)_(\d+)\.(webp|png)$/);
  if (!m) continue;
  if (only && m[1] !== only) continue;
  const key = m[1] + '_' + m[2];
  const cur = manifest[key] || '';
  if (cur.startsWith('http')) {
    skipped++;
    continue;
  }
  if (dry) {
    console.log('[dry]', f);
    continue;
  }
  const buf = fs.readFileSync(path.join(DIR, f));
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buf]), f);
  try {
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    const url = (await res.text()).trim();
    if (!url.startsWith('http')) {
      console.log('上传失败', f, url.slice(0, 80));
      continue;
    }
    manifest[key] = url;
    uploaded++;
    console.log('ok', f, '→', url);
    await new Promise((r) => setTimeout(r, 400));
  } catch (e) {
    console.log('上传异常', f, String(e).slice(0, 80));
  }
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 1), 'utf8');
console.log('上传:', uploaded, '跳过:', skipped, '| 清单:', Object.keys(manifest).length);
