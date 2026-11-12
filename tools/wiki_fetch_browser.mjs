// 用真实浏览器抓 wiki 页面（Cloudflare 对非浏览器客户端 403，浏览器能过）
// 用法: node tools/wiki_fetch_browser.mjs [--limit N] [--sleep 1200]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const CACHE = path.join(ROOT, '_tmp', 'wiki-cache');
const FAIL = path.join(ROOT, '_tmp', 'wiki-fail-browser.jsonl');
fs.mkdirSync(CACHE, { recursive: true });

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] || def : def;
};
const LIMIT = Number(opt('limit', '0')) || 0;
const SLEEP = Number(opt('sleep', '1200')) || 1200;

const targets = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/wiki-targets.json'), 'utf8'));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.setViewport({ width: 1280, height: 900 });

let ok = 0;
let skip = 0;
let fail = 0;
let done = 0;
const queue = [];
for (const t of targets) {
  const file = path.join(CACHE, t.file);
  if (fs.existsSync(file)) {
    skip++;
    continue;
  }
  queue.push({ ...t, file });
}
console.log('待抓', queue.length, '跳过', skip);

for (const t of queue) {
  if (LIMIT && done >= LIMIT) break;
  done++;
  const urls = [t.url];
  if (t.artist) urls.push('https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(t.title + ' (' + t.artist + ')'));
  let saved = false;
  const reasons = [];
  for (const url of urls) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const status = res ? res.status() : 0;
      await new Promise((r) => setTimeout(r, 600));
      const html = await page.content();
      if (status === 200 && html.length > 5000 && !/Just a moment|Attention Required/.test(html)) {
        fs.writeFileSync(t.file, html, 'utf8');
        ok++;
        saved = true;
        break;
      }
      reasons.push('status ' + status);
    } catch (e) {
      reasons.push(String(e).slice(0, 50));
    }
  }
  if (!saved) {
    fail++;
    fs.appendFileSync(FAIL, JSON.stringify({ id: t.id, title: t.title, reasons }) + '\n', 'utf8');
  }
  if (done % 20 === 0) console.log(`done=${done} ok=${ok} fail=${fail} skip=${skip}`);
  await new Promise((r) => setTimeout(r, SLEEP));
}

await browser.close();
console.log('结束 ok=', ok, 'fail=', fail, 'skip=', skip);
