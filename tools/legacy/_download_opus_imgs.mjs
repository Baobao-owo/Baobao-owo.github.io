import fs from 'node:fs';
import path from 'node:path';

const OUT = '_tmp/opus-imgs';
fs.mkdirSync(OUT, { recursive: true });

const j = JSON.parse(fs.readFileSync('_tmp/opus-images.json', 'utf8'));
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const downloaded = {};
for (const [id, info] of Object.entries(j)) {
  const imgs = (info.imgs || []).filter((x) => x.src);
  if (!imgs.length) continue;
  downloaded[id] = [];
  for (let i = 0; i < imgs.length; i++) {
    const url = imgs[i].src;
    const ext = url.includes('.avif') ? 'avif' : url.includes('.webp') ? 'webp' : 'jpg';
    const file = path.join(OUT, `${id}_${i}.${ext}`);
    if (fs.existsSync(file)) {
      downloaded[id].push(file);
      continue;
    }
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(file, buf);
      downloaded[id].push(file);
    } catch (e) {}
  }
  await new Promise((r) => setTimeout(r, 300));
}
fs.writeFileSync('_tmp/opus-downloaded.json', JSON.stringify(downloaded, null, 1), 'utf8');
console.log('posts with files:', Object.keys(downloaded).length);
for (const [id, files] of Object.entries(downloaded)) console.log(id, files.length);
