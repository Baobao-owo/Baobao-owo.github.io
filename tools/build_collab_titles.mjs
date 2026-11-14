// 把 docx 里的全部曲名导出为「合作曲」白名单（按站内曲名）
import fs from 'node:fs';

const p = JSON.parse(fs.readFileSync('_tmp/build/docx-paras.json', 'utf8'));
const COLOR = /[绿黄红紫黑]$/;
const titles = new Set();
for (const raw of p) {
  if (!raw.includes(' - ')) continue;
  const i = raw.indexOf(' - ');
  let t = raw.slice(0, i).trim();
  if (COLOR.test(t)) t = t.replace(COLOR, '').trim();
  titles.add(t);
}

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_]/g, '');

const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8')).songs
  .concat(JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8')));
const byNorm = new Map();
for (const s of site) byNorm.set(norm(s.title), s);

const out = [];
let miss = 0;
for (const t of titles) {
  const s = byNorm.get(norm(t));
  if (!s) { miss++; continue; }
  out.push(s.title);
}
fs.writeFileSync('source/_data/collab_docx_titles.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('写入合作白名单:', out.length, '| 站内没找到:', miss);
