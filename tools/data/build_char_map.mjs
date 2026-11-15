// 从 copel-popn 的角色表里抽「日文原名 → 中文名」对照，写成 _tmp/char-map.json
import fs from 'node:fs';

const TOKEN = process.env.GH_TOKEN || '';
const OWNER = 'copel-popn';
const REPO = 'copel-popn.github.io';
const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' };

async function tree() {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees/main?recursive=1`, { headers });
  const j = await res.json();
  return (j.tree || []).filter((x) => x.path.endsWith('.md')).map((x) => x.path);
}

async function content(path) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`, { headers });
  const j = await res.json();
  if (!j.content) return '';
  return Buffer.from(j.content, 'base64').toString('utf8');
}

const files = await tree();
const worlds = files.filter((p) => /(^|\/)README\.md$/.test(p) || /^docs\/[^/]+\.md$/.test(p));
console.log('候选页面:', worlds.length);

const map = new Map();
for (const p of worlds) {
  let md = '';
  try {
    md = await content(p);
  } catch (e) {
    continue;
  }
  const lines = md.split('\n');
  for (const line of lines) {
    if (!line.includes('|')) continue;
    // | [中文名](链接) | 日文原名 |
    const cells = line.split('|').map((c) => c.trim());
    for (let i = 0; i < cells.length - 1; i++) {
      const cn = cells[i];
      const jp = cells[i + 1];
      const cnName = (cn.match(/\[([^\]]+)\]/) || [])[1];
      if (!cnName) continue;
      if (!/[\u30A0-\u30FF\u3040-\u309F]/.test(jp)) continue; // 下一格要含日文假名
      const jpName = jp.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();
      if (!jpName || jpName.length < 2) continue;
      if (map.has(jpName)) continue;
      map.set(jpName, cnName.trim());
    }
  }
  await new Promise((r) => setTimeout(r, 150));
}

const out = Object.fromEntries(map);
fs.writeFileSync('_tmp/char-map.json', JSON.stringify(out, null, 1), 'utf8');
console.log('抽到对照:', Object.keys(out).length);
const sample = Object.entries(out).slice(0, 10);
sample.forEach(([k, v]) => console.log(k, '→', v));
