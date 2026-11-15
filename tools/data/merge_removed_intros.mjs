// 把删除曲的 wiki 介绍（日文原文 + 中文翻译）并进 chuni_extra.json
import fs from 'node:fs';

const decode = (s) =>
  String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

const intros = JSON.parse(fs.readFileSync('_tmp/wiki/removed-intros.json', 'utf8'));
const zh = {};
for (const f of ['b1', 'b2', 'b3', 'b4', 'b5']) {
  const p = `_tmp/tr/${f}.json`;
  if (!fs.existsSync(p)) continue;
  Object.assign(zh, JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')));
}

const EXTRA = 'source/_data/chuni_extra.json';
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));

let jpAdded = 0;
let zhAdded = 0;
const missingZh = [];

for (const [rawTitle, jp] of Object.entries(intros)) {
  const title = decode(rawTitle);
  const z = zh[rawTitle] || zh[title] || '';
  const cur = Object.assign({}, extra[title] || {});
  if (!cur.wiki_comment) {
    cur.wiki_comment = jp;
    jpAdded++;
  }
  if (!cur.wiki_comment_zh && z) {
    cur.wiki_comment_zh = z;
    zhAdded++;
  }
  if (!z) missingZh.push(title);
  extra[title] = cur;
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1) + '\n', 'utf8');
console.log('写入日文:', jpAdded, '| 写入中文:', zhAdded, '| 缺中文:', missingZh.length);
if (missingZh.length) console.log('缺中文列表:', missingZh.join(' | '));
