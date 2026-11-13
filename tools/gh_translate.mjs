// 在 GitHub Actions 里跑：翻译队列，或抓取队列里的 URL（DDG 搜索代理）
// 用法: node tools/gh_translate.mjs <queue.json> <out.jsonl> [sleepMs]
// 队列项: { k, t } 翻译；或 { k, u, q } 搜索（u 必须是 search: 前缀，q 为关键词）
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

function parseDDG(html, limit) {
  const results = [];
  const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) && results.length < limit) {
    let url = m[1].replace(/&amp;/g, '&');
    const u = url.match(/[?&]uddg=([^&]+)/);
    if (u) url = decodeURIComponent(u[1]);
    if (!/^https?:/i.test(url)) continue;
    results.push({ title: stripTags(m[2]), url, snippet: '', via: 'duckduckgo' });
  }
  const snips = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi)].map((x) => stripTags(x[1]));
  results.forEach((r, i) => {
    if (snips[i]) r.snippet = snips[i];
  });
  return results;
}

function parseSearx(html, limit) {
  const results = [];
  const re = /<a[^>]*href="([^"]+)"[^>]*class="url_header"[^>]*>|<h3><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h3>/gi;
  const re2 = /<article[^>]*class="result[^"]*"[\s\S]*?<h3>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re2.exec(html)) && results.length < limit) {
    const url = m[1].replace(/&amp;/g, '&');
    if (!/^https?:/i.test(url)) continue;
    results.push({ title: stripTags(m[2]), url, snippet: '', via: 'searxng' });
  }
  if (results.length) {
    const snips = [...html.matchAll(/<p class="content">([\s\S]*?)<\/p>/gi)].map((x) => stripTags(x[1]));
    results.forEach((r, i) => {
      if (snips[i]) r.snippet = snips[i];
    });
  }
  return results;
}

const SEARX = [
  'https://searx.be',
  'https://search.inetol.net',
  'https://priv.au',
  'https://searxng.site',
  'https://opnxng.com',
  'https://baresearch.org',
  'https://search.bus-hit.me',
  'https://searx.tiekoetter.com'
];

async function searchWeb(query, limit) {
  const attempts = [];

  // 1) DDG 直连（lite 先试）
  for (const ep of ['https://lite.duckduckgo.com/lite/', 'https://html.duckduckgo.com/html/']) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        body: 'q=' + encodeURIComponent(query)
      });
      const html = await res.text();
      const challenge = /complete the following challenge|bots use duckduckgo/i.test(html);
      attempts.push({ ep, status: res.status, challenge });
      if (!challenge) {
        const results = parseDDG(html, limit);
        if (results.length) return { via: ep, attempts, results };
      }
    } catch (e) {
      attempts.push({ ep, error: String(e.message || e).slice(0, 80) });
    }
  }

  // 2) SearXNG 实例兜底（默认聚合 DDG 等引擎）
  for (const base of SEARX) {
    try {
      const res = await fetch(base + '/search?q=' + encodeURIComponent(query) + '&language=en', {
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(20000)
      });
      const html = await res.text();
      attempts.push({ ep: base, status: res.status, len: html.length });
      const results = parseSearx(html, limit);
      if (results.length) return { via: base, attempts, results };
    } catch (e) {
      attempts.push({ ep: base, error: String(e.message || e).slice(0, 80) });
    }
  }

  return { error: 'no engine reachable', attempts };
}

let ok = 0;
let fail = 0;
for (const item of queue) {
  if (done.has(item.k)) continue;

  if (item.u && String(item.u).startsWith('search:')) {
    try {
      const r = await searchWeb(item.q || '', 10);
      fs.appendFileSync(outPath, item.k + '\t' + JSON.stringify(r) + '\n', 'utf8');
      ok++;
    } catch (e) {
      fs.appendFileSync(outPath, item.k + '\t' + JSON.stringify({ error: String(e).slice(0, 120) }) + '\n', 'utf8');
      fail++;
    }
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
