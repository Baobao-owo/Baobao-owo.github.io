import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, '_tmp/charts-removed');
const OWNER = 'Baobao-owo';
const REPO = 'Baobao-owo.github.io';
const PREFIX = 'chuni-previews-extra';
const TOKEN = process.env.GH_TOKEN || '';
const H = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };
const names = process.argv.slice(2);

const rel = await (await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${PREFIX}`, { headers: H })).json();
const manifestPath = path.join(ROOT, 'source/_data/chuni_previews.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const f of names) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) { console.log('missing local', f); continue; }
  const buf = fs.readFileSync(p);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${rel.id}/assets?name=${f}`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'image/webp', 'Content-Length': String(buf.length) },
        body: buf,
      });
      if (!res.ok) throw new Error(res.status + ' ' + (await res.text()).slice(0, 100));
      const j = await res.json();
      const key = f.replace(/\.webp$/, '').split('_').map((x) => String(Number(x))).join('_');
      manifest[key] = j.browser_download_url;
      console.log('ok', f, '→', j.browser_download_url);
      break;
    } catch (e) {
      console.log('retry', attempt, f, String(e).slice(0, 80));
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1), 'utf8');
console.log('manifest entries:', Object.keys(manifest).length);
