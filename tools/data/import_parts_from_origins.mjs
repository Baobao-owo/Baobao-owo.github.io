// 从 wiki 曲目页的「由来」里找内嵌的「担当箇所 / 担当ND」表，补进 collab_parts.json
import fs from 'node:fs';

const FILE = 'source/_data/collab_parts.json';
const parts = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const targets = process.argv.slice(2);
for (const t of targets) {
  const f = '_tmp/wiki/songpage/' + t.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (!fs.existsSync(f)) {
    console.log('缺页面:', t);
    continue;
  }
  const html = fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  let found = null;
  for (const tb of tables) {
    if (!/担当/.test(tb)) continue;
    const rows = [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
      [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
    );
    if (!rows.length) continue;
    const head = rows[0];
    if (!head.some((h) => /担当/.test(h))) continue;
    found = { headers: head, rows: rows.slice(1).filter((r) => r.length >= 2 && r.some((c) => c)) };
    break;
  }
  if (!found) {
    console.log('没找到分工表:', t);
    continue;
  }
  parts[norm(t)] = { title: t, headers: found.headers, rows: found.rows };
  console.log('加入:', t, '行数', found.rows.length);
}
fs.writeFileSync(FILE, JSON.stringify(parts, null, 1) + '\n', 'utf8');
console.log('现有分工表:', Object.keys(parts).length);
