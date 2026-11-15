// 扫描已缓存的 wiki 曲目页，抽取所有「担当箇所 / 担当ND」分工表
import fs from 'node:fs';
import path from 'node:path';

const DIR = '_tmp/wiki/songpage';
const OUT = '_tmp/build/parts-all.json';

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

const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const byNorm = new Map();
for (const s of site.songs) byNorm.set(norm(s.title), s.title);

const out = {};
const pages = [];
let noTime = [];

for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const tables = [...raw.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  let found = false;
  for (const t of tables) {
    const rows = [...t.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
      [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
    );
    if (!rows.length) continue;
    const head = rows[0];
    if (!head.some((h) => /担当/.test(h))) continue;
    const body = rows.slice(1).filter((r) => r.length >= 2 && r.some((c) => c));
    const hasTime = body.some((r) => /\d+\s*[:：]\s*\d+|\d+秒|～/.test(r[0] || ''));
    if (!hasTime) continue;
    const title = byNorm.get(norm(f.replace(/\.html$/, ''))) || f.replace(/\.html$/, '');
    // 难度线索：表格前后文本里的 (MAS)(EXP)(WE蔵) 等
    const after = raw.slice(raw.indexOf(t), raw.indexOf(t) + 3000);
    const before = raw.slice(Math.max(0, raw.indexOf(t) - 1200), raw.indexOf(t));
    const zone = before + after;
    const diff = /WE蔵|\(WE\)|（WE）/.test(zone)
      ? 'we'
      : /MAS|MASTER/.test(zone)
        ? 'master'
        : /ULT|ULTIMA/.test(zone)
          ? 'ultima'
          : /EXP/.test(zone)
            ? 'expert'
            : 'master';
    out[norm(title)] = { title, headers: head, rows: body, diff };
    found = true;
    break;
  }
  if (!found) {
    if (/担当/.test(raw)) noTime.push(f);
  } else pages.push(f);
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('抽取到分工表:', Object.keys(out).length, '| 有担当但没时间行:', noTime.length);
for (const k of Object.keys(out)) {
  console.log('  ', out[k].title, '|', out[k].diff, '|', out[k].rows.length, '行');
}
