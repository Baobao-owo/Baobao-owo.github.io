// 扫描所有「A & B」「A VS B」「A × B」这类联名写法，尽量拆成两个正式名
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '');

const FRIEND = 'D:/QQ/Downloads/songs.min.json';
const friend = JSON.parse(fs.readFileSync(FRIEND, 'utf8'));

// 别名 → 正式名
const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
// 额外人工映射（已在项目里）
const extraPath = 'tools/designer-alias-extra.json';
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8').replace(/^\uFEFF/, ''));
for (const [a, b] of Object.entries(extra)) alias2who.set(norm(a), b);

// 收集所有谱面署名
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));
const raws = new Set();
for (const s of site.songs.concat(removed)) {
  for (const sh of s.sheets || []) {
    const d = String(sh.designer || '').trim();
    if (d) raws.add(d);
  }
}

const SEP = /\s*(?:&|＆|\bVS\b|\bvs\b|×|／\/|＋)\s*/;
const found = [];
for (const raw of raws) {
  if (!SEP.test(raw)) continue;
  const parts = raw.split(SEP).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) continue;
  const resolved = parts.map((p) => alias2who.get(norm(p)) || alias2who.get(norm(p.replace(/^【Ex】/, ''))) || '');
  if (resolved.every(Boolean)) {
    const who = resolved.join(' × ');
    found.push({ raw, who, parts, resolved });
  } else {
    found.push({ raw, who: '', parts, resolved });
  }
}

fs.writeFileSync('_tmp/build/split-aliases.json', JSON.stringify(found, null, 1), 'utf8');
const ok = found.filter((x) => x.who);
console.log('联名写法:', found.length, '| 两边都能解析:', ok.length);
ok.forEach((x) => console.log('  ' + x.raw + '  →  ' + x.who));
console.log('--- 解析不了的 ---');
found.filter((x) => !x.who).slice(0, 20).forEach((x) => console.log('  ' + x.raw + '   (' + x.parts.join(' | ') + ')'));
