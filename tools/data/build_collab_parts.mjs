// 从 wiki 曲目页抽「担当箇所 / 担当ND」表（合作曲分工），几乎原样保留
// 输出：source/assets/data/collab-parts.json
//   { "<规范化曲名>": { headers: ["担当箇所","担当ND"], rows: [["0:00～0:18","ぴちネコ"], ...] } }
import fs from 'node:fs';
import path from 'node:path';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, ' ')
    .trim();
}

const DIR = '_tmp/wiki/songpage';
const OUT = 'source/assets/data/collab-parts.json';
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const byNorm = new Map();
for (const s of site.songs) byNorm.set(norm(s.title), s.title);

const out = {};
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  for (const t of tables) {
    const rows = [...t.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
      [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
    );
    if (!rows.length) continue;
    const head = rows[0];
    const isPartTable = head.some((h) => /担当/.test(h)) && head.length >= 2;
    if (!isPartTable) continue;
    const title = byNorm.get(norm(f.replace(/\.html$/, ''))) || f.replace(/\.html$/, '');
    const body = rows.slice(1).filter((r) => r.length >= 2 && r.some((c) => c));
    if (!body.length) continue;
    out[norm(title)] = { title, headers: head, rows: body };
    break;
  }
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
const keys = Object.keys(out);
console.log('带分工表的曲:', keys.length);
keys.forEach((k) => console.log('  ' + out[k].title + '  行 ' + out[k].rows.length + '  表头 ' + out[k].headers.join('/')));
