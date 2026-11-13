// 在 GitHub Actions 里跑：翻译队列，或抓取队列里的 URL（DDG 搜索代理）
// 用法: node tools/gh_translate.mjs <queue.json> <out.jsonl> [sleepMs]
// 队列项: { k, t } 翻译；或 { k, u, q } 抓取（u 为 URL，q 为 DDG 查询词）
import fs from 'node:fs';

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

function stripTags(s) {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchDDG(query) {
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    body: 'q=' + encodeURIComponent(query)
  });
  const html = await res.text();
  if (/complete the following challenge|bots use duckduckgo/i.test(html)) {
    return { error: 'challenge', status: res.status };
  }
  const results = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && results.length < 20) {
    let url = m[1].replace(/&amp;/g, '&');
    const u = url.match(/[?&]uddg=([^&]+)/);
    if (u) url = decodeURIComponent(u[1]);
    if (!/^https?:/i.test(url)) continue;
    results.push({ title: stripTags(m[2]), url, snippet: '' });
  }
  const snips = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)].map((x) => stripTags(x[1]));
  results.forEach((r, i) => {
    if (snips[i]) r.snippet = snips[i];
  });
  return { status: res.status, results };
}

let ok = 0;
let fail = 0;
for (const item of queue) {
  if (done.has(item.k)) continue;

  if (item.u) {
    try {
      const r = await fetchDDG(item.q || item.u);
      fs.appendFileSync(outPath, item.k + '\t' + JSON.stringify(r) + '\n', 'utf8');
      ok++;
    } catch (e) {
      fs.appendFileSync(outPath, item.k + '\t' + JSON.stringify({ error: String(e).slice(0, 120) }) + '\n', 'utf8');
      fail++;
    }
    await sleep(Math.min(SLEEP, 200));
    continue;
  }

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
