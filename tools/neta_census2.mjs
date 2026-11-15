// 第二轮：对首轮无证据的曲目换更宽松的查询再抓一次
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_tmp/neta-census2');
fs.mkdirSync(OUT, { recursive: true });

const evidence = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/neta-evidence.json'), 'utf8'));
const targets = evidence.filter((e) => !e.hits.length).map((e) => e.song);
console.log('需补查:', targets.length);

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

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

async function bing(q, limit = 4) {
  const res = await fetch('https://www.bing.com/search?q=' + encodeURIComponent(q) + '&count=' + limit + '&setlang=ja', {
    headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' },
    signal: AbortSignal.timeout(25000)
  });
  const html = await res.text();
  const out = [];
  for (const raw of html.split(/<li class="b_algo"/i).slice(1)) {
    if (out.length >= limit) break;
    const href = (raw.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"/i) || [])[1];
    const title = (raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
    const snip = (raw.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    if (!href) continue;
    out.push({ url: href, title: stripTags(title || ''), snippet: stripTags(snip || '') });
  }
  return out;
}

const slug = (t) => String(t).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80);

let saved = 0;
for (let i = 0; i < targets.length; i++) {
  const song = targets[i];
  const file = path.join(OUT, slug(song) + '.json');
  if (fs.existsSync(file)) continue;
  const rec = { song, at: new Date().toISOString(), results: [] };
  try {
    for (const q of [`${song} CHUNITHM`, `${song} 譜面`]) {
      rec.results.push({ q, hits: await bing(q, 3) });
      await new Promise((r) => setTimeout(r, 600));
    }
  } catch (e) {
    rec.error = String(e).slice(0, 80);
  }
  fs.writeFileSync(file, JSON.stringify(rec, null, 1), 'utf8');
  saved++;
  if (saved % 50 === 0) console.log('补查进度', saved, '/', targets.length);
  await new Promise((r) => setTimeout(r, 700));
}
console.log('补查完成 saved=', saved);
