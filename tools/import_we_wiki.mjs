// 解析 wiki 的 WORLD'S END 页面（属性 / ☆ / NOTES DESIGNER），写 source/_data/chuni_we.json
import fs from 'node:fs';

const ROOT = process.cwd();
const HTML = ROOT + '/_tmp/wiki-we.html';
const OUT = ROOT + '/source/_data/chuni_we.json';

const html = fs.readFileSync(HTML, 'utf8');
const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);

function cells(tr) {
  return [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
    c[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

const out = {};
let rows = 0;
for (const t of tables) {
  const trs = [...t.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0]);
  for (const tr of trs) {
    const c = cells(tr);
    if (c.length < 4) continue;
    const [title, attr, stars, designer] = c;
    const sm = stars.match(/^☆(\d+)$/);
    if (!sm) continue;
    if (!title || title.length < 1) continue;
    rows++;
    out[title] = { attr, stars: Number(sm[1]), designer };
  }
}

fs.writeFileSync(OUT, JSON.stringify({ source: "wikiwiki WORLD'S END", updated: new Date().toISOString().slice(0, 10), songs: out }, null, 0), 'utf8');
console.log('解析到 WE 条目:', rows, '| 写入', OUT);
const sample = Object.entries(out).slice(0, 8);
sample.forEach(([k, v]) => console.log(k, '|', v.attr, '| ☆' + v.stars, '|', v.designer));
