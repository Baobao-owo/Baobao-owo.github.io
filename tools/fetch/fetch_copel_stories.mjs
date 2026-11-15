// 抓取 copel-popn 剧情站全部 markdown 页面
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_tmp/refs/copel');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://copel-popn.github.io';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(res.status);
  return await res.text();
}

const sidebar = await get(BASE + '/_sidebar.md');
const links = new Set();
for (const m of sidebar.matchAll(/\]\(([^)]+)\)/g)) {
  let u = m[1];
  if (!u || u.startsWith('http')) continue;
  u = u.split('?')[0].split('#')[0];
  if (!u.startsWith('/')) u = '/' + u;
  if (!u.endsWith('.md')) u += '.md';
  links.add(u);
}
console.log('发现页面:', links.size);

let ok = 0;
let fail = 0;
const index = [];
for (const u of links) {
  const slug = u.replace(/^\//, '').replace(/\//g, '__');
  const file = path.join(OUT, slug);
  if (fs.existsSync(file)) {
    ok++;
    continue;
  }
  try {
    const text = await get(BASE + u);
    fs.writeFileSync(file, text, 'utf8');
    const title = (text.match(/^#\s+(.+)$/m) || [])[1] || slug;
    index.push({ path: u, file: slug, title: title.trim(), size: text.length });
    ok++;
  } catch (e) {
    fail++;
    console.log('fail', u, String(e).slice(0, 40));
  }
  await new Promise((r) => setTimeout(r, 120));
}
fs.writeFileSync(path.join(OUT, '_index.json'), JSON.stringify(index, null, 1), 'utf8');
console.log('下载完成 ok=', ok, 'fail=', fail);
