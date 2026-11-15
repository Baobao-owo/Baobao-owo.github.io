// 把 B 站专栏转成博客文章：下载图片到仓库，替换图片占位符，写出 md
import fs from 'node:fs';
import path from 'node:path';

const MD_IN = '_tmp/bili-opus.md';
const IMGS = JSON.parse(fs.readFileSync('_tmp/bili-opus-imgs.json', 'utf8'));
const OUT_DIR = 'source/assets/img/bili-opus-act2';
const POST = 'source/_posts/tuiqiu-act2-notes.md';

fs.mkdirSync(OUT_DIR, { recursive: true });

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.bilibili.com/',
};

let ok = 0;
let fail = 0;
const local = [];

for (let i = 0; i < IMGS.length; i++) {
  const url = IMGS[i].startsWith('//') ? 'https:' + IMGS[i] : IMGS[i];
  // 去掉 @... 后缀拿原图
  const base = url.split('@')[0];
  const extMatch = base.match(/\.(webp|jpg|jpeg|png|gif)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const name = String(i + 1).padStart(2, '0') + '.' + ext;
  const out = path.join(OUT_DIR, name);
  if (!fs.existsSync(out)) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 800) throw new Error('too small ' + buf.length);
      fs.writeFileSync(out, buf);
      ok++;
    } catch (e) {
      fail++;
      console.log('  fail', i, String(e).slice(0, 60), url.slice(0, 80));
      local.push('');
      continue;
    }
  } else {
    ok++;
  }
  local.push('/assets/img/bili-opus-act2/' + name);
}

let md = fs.readFileSync(MD_IN, 'utf8');
md = md.replace(/\{\{IMG:(\d+)\}\}/g, (m, n) => {
  const p = local[Number(n)];
  return p ? '![](' + p + ')' : '';
});
// 标题降一级（正文里不再用 h1，避免跟文章标题打架）
md = md.replace(/^(#{1,3}) /gm, (m, h) => '#' + h + ' ');

// 掉没下下来的空图片
md = md.replace(/!\[\]\(\s*\)/g, '');
md = md.replace(/\n{3,}/g, '\n\n').trim();

const front = `---
title: 推球杯 Act.2 杂记（上）
date: 2026-10-08 23:51:00
categories: 杂谈
tags: [推球杯, 中二节奏, 比赛杂记]
---

> 本文原载于 B 站专栏 [cv53343991](https://www.bilibili.com/read/cv53343991)，搬到博客留个档。

`;

const tail = `

---

*原文：[推球杯Act.2杂记（上）](https://www.bilibili.com/opus/1256849044483866632) · 作者 FDShijing*
`;

fs.writeFileSync(POST, front + md + tail, 'utf8');
console.log('图片 成功', ok, '失败', fail, '| 正文', md.length, '字', '| 文章', POST);
