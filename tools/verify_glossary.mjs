// 用语料核对术语译名：看建议中文是否出现在萌百参考页里
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const refs = {};
for (const f of ['CHUNITHM', '梗', '用语']) {
  const p = path.join(ROOT, '_tmp/refs', f + '.txt');
  if (fs.existsSync(p)) refs[f] = fs.readFileSync(p, 'utf8');
}
const all = Object.values(refs).join('\n');
console.log('参考页:', Object.entries(refs).map(([k, v]) => k + '(' + v.length + ')').join(' '));

const data = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/chuni-glossary.json'), 'utf8'));

function occurrences(hay, needle) {
  if (!needle) return 0;
  let c = 0;
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    c++;
    i += needle.length;
  }
  return c;
}

const results = [];
for (const r of data.seed) {
  const zh = r.zh.split(' / ')[0].split('（')[0].trim();
  const hits = occurrences(all, zh);
  results.push({ cat: r.category, jp: r.jp, zh: r.zh, hits });
}

const verified = results.filter((r) => r.hits > 0);
const unverified = results.filter((r) => r.hits === 0);
fs.writeFileSync(path.join(ROOT, '_tmp/glossary-verify.json'), JSON.stringify({ verified, unverified }, null, 1), 'utf8');
console.log('命中:', verified.length, '| 未命中:', unverified.length);
console.log('命中样本:', verified.slice(0, 20).map((r) => r.jp + '→' + r.zh + '(' + r.hits + ')').join(' | '));
console.log('未命中:', unverified.map((r) => r.jp + '→' + r.zh).join(' | '));
