// 批量机翻：把 chuni_extra 里缺中文的曲目补上（Google 免费接口，带退避与断点）
// 用法: node tools/translate_batch.mjs [--limit 50] [--sleep 1500]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXTRA = path.join(ROOT, 'source/_data/chuni_extra.json');
const LOG = path.join(ROOT, '_tmp/translate_failures.json');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] || def : def;
};
const LIMIT = Number(opt('limit', '0')) || 0;
const SLEEP = Number(opt('sleep', '1200')) || 1200;

const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));
let failures = {};
try {
  failures = JSON.parse(fs.readFileSync(LOG, 'utf8'));
} catch (e) {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Referer: 'https://translate.google.com/'
};

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function translate(text) {
  const q = encodeURIComponent(String(text).slice(0, 4500));
  // 先试 dict-chrome-ex（快），失败再走 gtx
  try {
    const raw = await fetchWithTimeout(
      'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ja&tl=zh-CN&q=' + q,
      15000
    );
    const j = JSON.parse(raw);
    const out = Array.isArray(j[0]) ? j.map((x) => x[0]).join('') : j[0];
    if (out) return out;
  } catch (e) {}
  const raw2 = await fetchWithTimeout(
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=zh-CN&dt=t&q=' + q,
    15000
  );
  const data = JSON.parse(raw2);
  return ((data && data[0]) || []).map((s) => s[0]).join('');
}

let keys = Object.keys(extra).filter((k) => {
  const e = extra[k] || {};
  const hasJa = e.wiki_comment || e.wiki_jp;
  return hasJa && !e.wiki_comment_zh;
});
keys.sort();
if (LIMIT) keys = keys.slice(0, LIMIT);
console.log('待翻译:', keys.length);

let ok = 0;
let fail = 0;
const failReasons = {};
for (const key of keys) {
  const e = extra[key];
  const src = e.wiki_comment || e.wiki_jp;
  let zh = '';
  let lastErr = '';
  for (let attempt = 0; attempt < 3 && !zh; attempt++) {
    try {
      zh = await translate(src);
    } catch (err) {
      lastErr = String(err).slice(0, 60);
      await sleep(3000 * (attempt + 1));
    }
  }
  if (!zh) {
    fail++;
    failures[key] = lastErr || 'translate_failed';
    console.log('失败', key, lastErr);
    continue;
  }
  e.wiki_comment_zh = zh;
  delete failures[key];
  ok++;
  if (ok % 5 === 0) {
    fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
    console.log('已翻译', ok, '/', keys.length);
  }
  await sleep(SLEEP);
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
fs.writeFileSync(LOG, JSON.stringify(failures, null, 1), 'utf8');
console.log('完成：成功', ok, '失败', fail);
