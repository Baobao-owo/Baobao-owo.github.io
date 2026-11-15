import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8')).songs;
const built = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'));
const DIFFJA = { b: 'BASIC', a: 'ADVANCED', e: 'EXPERT', m: 'MASTER', u: 'ULTIMA' };
const SEP = /(vs\.?|VS\.?|meets|1P[:：]|2P[:：]|＆|&|×|＋|\bと\b)/i;

const rows = [];
for (const [title, entry] of Object.entries(designers.songs || {})) {
  const b = built.find((s) => norm(s.t) === norm(title));
  if (!b) continue;
  for (const [k, cell] of Object.entries(entry)) {
    if (!cell || !cell.raw || !cell.who) continue;
    if (!SEP.test(cell.raw)) continue;
    if (collab[title] && collab[title][k] && collab[title][k].length >= 2) continue;
    rows.push({
      title,
      diff: DIFFJA[k],
      raw: cell.raw,
      who: cell.who,
      cl: b.cl,
    });
  }
}
fs.writeFileSync('_tmp/suspicious_credits.json', JSON.stringify(rows, null, 1), 'utf8');
console.log('可疑署名条数:', rows.length, '涉及曲目:', new Set(rows.map((r) => r.title)).size);
rows.slice(0, 12).forEach((r) => console.log('  ' + r.title + ' [' + r.diff + '] ' + r.raw + ' → ' + r.who + ' (cl=' + r.cl + ')'));
