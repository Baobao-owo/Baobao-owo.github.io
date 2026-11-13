// 谱面 neta 研究：搜索 + 抓取 + 抽取疑似「元ネタ」句子
// 用法: node tools/neta_research.mjs "曲名" ["曲名2" ...]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const OUT_DIR = path.join(process.cwd(), '_tmp/neta');
fs.mkdirSync(OUT_DIR, { recursive: true });

const NETA_KEYS = [
  '元ネタ',
  'モチーフ',
  'パロディ',
  'オマージュ',
  'リスペクト',
  '元曲',
  '原曲',
  'ネタ',
  '称号',
  'ND名義',
  '譜面名義',
  '引用',
  'MV',
  'PV',
  'コラボ',
  'アニメ',
  'ゲーム',
  '映画'
];

function stripTags(s) {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'ja,en;q=0.8,zh-CN;q=0.6',
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8'
    },
    signal: AbortSignal.timeout(25000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.text();
}

let browser = null;
async function fetchViaBrowser(url) {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-gpu']
    });
  }
  const page = await browser.newPage();
  try {
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1200));
    return await page.evaluate(() => document.body.innerText);
  } finally {
    await page.close();
  }
}

async function pageText(url) {
  try {
    const html = await fetchText(url);
    const text = stripTags(html);
    if (text.length > 200) return { via: 'http', text };
  } catch (e) {}
  const text = await fetchViaBrowser(url);
  return { via: 'browser', text };
}

async function bingSearch(query, limit = 8) {
  const html = await fetchText(
    'https://www.bing.com/search?q=' + encodeURIComponent(query) + '&count=' + limit + '&setlang=ja'
  );
  const out = [];
  for (const raw of html.split(/<li class="b_algo"/i).slice(1)) {
    if (out.length >= limit) break;
    const href = (raw.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"/i) || [])[1];
    const title = (raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
    if (!href) continue;
    out.push({ url: href, title: stripTags(title || '').replace(/\n/g, ' ') });
  }
  return out;
}

function extractNeta(text, title) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 8);
  const scored = [];
  const seen = new Set();
  for (const l of lines) {
    if (l.length > 400) continue;
    let score = 0;
    for (const k of NETA_KEYS) if (l.includes(k)) score++;
    if (title && l.includes(title)) score++;
    if (/[「『].{2,30}[」』]/.test(l)) score++;
    if (score >= 2 && !seen.has(l)) {
      seen.add(l);
      scored.push(l);
    }
  }
  return scored.slice(0, 40);
}

function slug(s) {
  return String(s).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60);
}

const titles = process.argv.slice(2);
if (!titles.length) {
  console.error('用法: node tools/neta_research.mjs "曲名" ...');
  process.exit(1);
}

const summary = [];
for (const title of titles) {
  const queries = [
    `"${title}" CHUNITHM 譜面`,
    `"${title}" CHUNITHM 称号 元ネタ`,
    `site:chunithm.gamerch.com "${title}"`,
    `site:wikiwiki.jp/chunithmwiki "${title}"`
  ];
  const pages = [];
  const seenUrls = new Set();
  for (const q of queries) {
    let results = [];
    try {
      results = await bingSearch(q, 6);
    } catch (e) {
      continue;
    }
    for (const r of results) {
      if (seenUrls.has(r.url)) continue;
      seenUrls.add(r.url);
      pages.push({ ...r, query: q });
      if (pages.length >= 10) break;
    }
    if (pages.length >= 10) break;
  }

  const evidence = [];
  for (const p of pages) {
    try {
      const { via, text } = await pageText(p.url);
      const lines = extractNeta(text, title);
      if (lines.length) {
        evidence.push({ url: p.url, via, title: p.title, hits: lines });
      }
    } catch (e) {
      // 忽略抓取失败
    }
  }

  const rec = { song: title, at: new Date().toISOString(), pages: pages.length, evidence };
  fs.writeFileSync(path.join(OUT_DIR, slug(title) + '.json'), JSON.stringify(rec, null, 2), 'utf8');
  summary.push({ song: title, pages: pages.length, evidencePages: evidence.length, hits: evidence.reduce((a, e) => a + e.hits.length, 0) });
  console.log(title, '| 页面', pages.length, '| 有 neta 的页', evidence.length, '| 命中行', summary[summary.length - 1].hits);
}

if (browser) await browser.close();
fs.writeFileSync(path.join(OUT_DIR, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log('输出目录:', OUT_DIR);
