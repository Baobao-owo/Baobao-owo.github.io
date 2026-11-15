// 同步/校验两份合作分工表：source/_data/collab_parts.json 与 source/assets/data/collab-parts.json
// 用法：node tools/data/sync_collab_parts.mjs          # 只校验，打印差异
//       node tools/data/sync_collab_parts.mjs --write  # 把 _data 版本写到 assets（或反之，--from=assets）
import fs from 'node:fs';

const A = 'source/_data/collab_parts.json';
const B = 'source/assets/data/collab-parts.json';
const args = process.argv.slice(2);
const write = args.includes('--write');
const from = (args.find((a) => a.startsWith('--from=')) || '--from=data').split('=')[1];

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const a = read(A);
const b = read(B);
const ka = new Set(Object.keys(a));
const kb = new Set(Object.keys(b));
const onlyA = [...ka].filter((k) => !kb.has(k));
const onlyB = [...kb].filter((k) => !ka.has(k));
const differ = [...ka].filter((k) => kb.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]));

console.log(`${A}: ${ka.size} 首`);
console.log(`${B}: ${kb.size} 首`);
console.log(`只在 _data: ${onlyA.length}`, onlyA.slice(0, 8));
console.log(`只在 assets: ${onlyB.length}`, onlyB.slice(0, 8));
console.log(`内容不同: ${differ.length}`, differ.slice(0, 8));

if (write && (onlyA.length || onlyB.length || differ.length)) {
  const src = from === 'assets' ? b : a;
  const dstPath = from === 'assets' ? A : B;
  fs.writeFileSync(dstPath, JSON.stringify(src, null, 1) + '\n', 'utf8');
  console.log('已写入', dstPath, '条目', Object.keys(src).length);
} else if (write) {
  console.log('两份一致，无需写入');
}
