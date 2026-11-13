// 在 GitHub Actions 里跑：把队列文件翻译成 JSONL（key\t译文，换行转 ⏎）
// 用法: node tools/gh_translate.mjs <queue.json> <out.jsonl> [sleepMs]
import fs from 'node:fs';
import path from 'node:path';

const [, , queuePath, outPath, sleepArg] = process.argv;
const SLEEP = Number(sleepArg || '700');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
console.log('queue', queue.length, '->', outPath);

const done = new Set();
if (fs.existsSync(outPath)) {
  for (const line of fs.readFileSync(outPath, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf('\t');
    if (i > 0) done.add(line.slice(0, i));
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translate(text) {
  const q = encodeURIComponent(String(text).slice(0, 4500));
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ja&tl=zh-CN&q=${q}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://translate.google.com/' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  const out = Array.isArray(j[0]) ? j.map((x) => x[0]).join('') : j[0];
  return String(out || '');
}

let ok = 0;
let fail = 0;
for (const item of queue) {
  if (done.has(item.k)) continue;
  let zh = '';
  for (let attempt = 0; attempt < 3 && !zh; attempt++) {
    try {
      zh = await translate(item.t);
    } catch (e) {
      console.log('retry', item.k, String(e).slice(0, 40));
      await sleep(2000 * (attempt + 1));
    }
  }
  if (!zh) {
    fail++;
    continue;
  }
  fs.appendFileSync(outPath, item.k + '\t' + zh.replace(/\r/g, '').replace(/\n/g, '⏎') + '\n', 'utf8');
  ok++;
  if (ok % 50 === 0) console.log('ok', ok);
  await sleep(SLEEP);
}
console.log('done ok=', ok, 'fail=', fail);
