import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('_tmp/opus-ocr.json', 'utf8').replace(/^\uFEFF/, ''));
const keys = Object.keys(raw);
console.log('ocr entries', keys.length);
const hits = [];
for (const k of keys) {
  const t = String(raw[k] || '').replace(/\s+/g, '');
  if (/删除|下架|配信停止|削除/.test(t)) hits.push({ file: k, text: String(raw[k]).replace(/\s+/g, ' ').slice(0, 200) });
}
console.log('hits', hits.length);
hits.forEach((h) => console.log('---', h.file, '|', h.text));
