// 重试抓取失败的 wiki 页面：先用站内搜索找到真实页名，再抓那一页
// 用法: node tools/wiki_retry_browser.mjs [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const CACHE = path.join(ROOT, '_tmp', 'wiki-cache');
const LOG = path.join(ROOT, '_tmp', 'wiki-retry.log');
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf('--' + n);
  return i >= 0 ? args[i + 1] || d : d;
};
const LIMIT = Number(opt('limit', '0')) || 0;

const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const fileOf = (id) => crypto.createHash('md5').update(String(id)).digest('hex') + '.html';

// 找没缓存的目标
const missing = [];
for (const s of guide.songs) {
  const f = path.join(CACHE, fileOf(s.id));
  if (!fs.existsSync(f)) missing.push(s);
}
console.log('缺缓存的曲目:', missing.length);

function norm(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'"“”‘’・:：;；,，.。~～\-—_]/g, '');
}

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);

let ok = 0;
let fail = 0;
let done = 0;
for (const s of missing) {
  if (LIMIT && done >= LIMIT) break;
  done++;
  const targetFile = path.join(CACHE, fileOf(s.id));
  let saved = false;
  const tried = [];
  try {
    // 1) 站内搜索
    const searchUrl = 'https://wikiwiki.jp/chunithmwiki/?cmd=search&word=' + encodeURIComponent(s.title);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 900));
    const cands = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href^="/chunithmwiki/"]'))
        .map((a) => ({ href: a.getAttribute('href'), text: (a.innerText || '').trim() }))
        .filter((x) => x.text && x.href && !x.href.includes('::'))
    );
    const want = norm(s.title);
    const best = cands.find((c) => norm(c.text) === want) || cands.find((c) => norm(c.text).includes(want) || want.includes(norm(c.text)));
    if (best) {
      tried.push('search:' + best.text);
      await page.goto('https://wikiwiki.jp' + best.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 800));
      const html = await page.content();
      if (html.length > 5000) {
        fs.writeFileSync(targetFile, html, 'utf8');
        ok++;
        saved = true;
      }
    } else {
      tried.push('no search hit (' + cands.length + ' links)');
    }
  } catch (e) {
    tried.push('err ' + String(e).slice(0, 40));
  }
  if (!saved) fail++;
  fs.appendFileSync(LOG, JSON.stringify({ id: s.id, title: s.title, ok: saved, tried }) + '\n', 'utf8');
  if (done % 10 === 0) console.log(`done=${done} ok=${ok} fail=${fail}`);
  await new Promise((r) => setTimeout(r, 800));
}
await browser.close();
console.log('结束 ok=', ok, 'fail=', fail);
