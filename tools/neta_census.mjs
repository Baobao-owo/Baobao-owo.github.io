// 后台 neta 普查：为候选曲目抓 Bing 摘要，落盘 _tmp/neta-census/
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8').replace(/^\uFEFF/, ''));
const OUT = path.join(ROOT, '_tmp/neta-census');
fs.mkdirSync(OUT, { recursive: true });

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
  const res = await fetch(
    'https://www.bing.com/search?q=' + encodeURIComponent(q) + '&count=' + limit + '&setlang=ja',
    { headers: { 'User-Agent': UA, 'Accept-Language': 'ja,en;q=0.8' }, signal: AbortSignal.timeout(25000) }
  );
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

// 优先级：有由来的优先，其次介绍里带引号/外文的
const songs = Object.entries(extra)
  .map(([title, e]) => {
    const intro = String(e.wiki_comment || '');
    const origins = (e.origins || []).join('\n');
    const blob = intro + '\n' + origins;
    let score = origins.length ? 3 : 0;
    score += (blob.match(/[「『]/g) || []).length;
    score += /[A-Za-z]{4,}/.test(blob) ? 1 : 0;
    return { title, score, blob };
  })
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score);

const slug = (t) => String(t).replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 80);

let done = 0;
let saved = 0;
for (const s of songs) {
  const file = path.join(OUT, slug(s.title) + '.json');
  if (fs.existsSync(file)) {
    done++;
    continue;
  }
  const rec = { song: s.title, at: new Date().toISOString(), results: [] };
  try {
    for (const q of [`"${s.title}" CHUNITHM 元ネタ`, `"${s.title}" 譜面 称号`]) {
      const r = await bing(q, 3);
      rec.results.push({ q, hits: r });
      await new Promise((res) => setTimeout(res, 600));
    }
  } catch (e) {
    rec.error = String(e).slice(0, 80);
  }
  fs.writeFileSync(file, JSON.stringify(rec, null, 1), 'utf8');
  saved++;
  done++;
  if (saved % 20 === 0) console.log('进度', done, '/', songs.length);
  await new Promise((res) => setTimeout(res, 700));
}
console.log('完成 done=', done, 'saved=', saved, 'total=', songs.length);
