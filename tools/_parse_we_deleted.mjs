// 解析 wiki「WORLD'S END(備考・配信終了)」的曲目表
import fs from 'node:fs';

const html = fs.readFileSync('_tmp/wiki-we-deleted.html', 'utf8');
const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);

function cells(tr) {
  return [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) =>
    c[1]
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

const rows = [];
for (const t of tables) {
  for (const tr of t.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const c = cells(tr[0]);
    if (c.length < 2) continue;
    const [title, attr] = c;
    if (!title || title === '楽曲') continue;
    if (!attr || attr.length > 6) continue;
    rows.push({ title, attr });
  }
}

// 去重
const seen = new Set();
const uniq = [];
for (const r of rows) {
  const k = r.title + '|' + r.attr;
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(r);
}

fs.writeFileSync('_tmp/we-deleted.json', JSON.stringify(uniq, null, 1), 'utf8');
console.log('删除 WE 条目:', uniq.length);
console.log(uniq.slice(0, 12).map((r) => r.title + ' [' + r.attr + ']').join(' | '));
