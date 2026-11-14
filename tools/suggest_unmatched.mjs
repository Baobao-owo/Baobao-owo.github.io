// 给未匹配的「疑似歌曲」找站内最相近的曲名（供人工判断）
import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('_tmp/build/unmatched-notes.json', 'utf8')).filter((r) => r.kind.includes('歌曲'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&＜＞《》○●◆◇■□☆★]/g, '');

const titles = [];
for (const s of site.songs) titles.push({ t: s.title, n: norm(s.title) });
for (const s of removed) titles.push({ t: s.title, n: norm(s.title) });

function bigrams(s) {
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
}

const out = [];
for (const r of rows) {
  const key = norm(r.title);
  const scored = titles
    .map((t) => ({ t: t.t, s: dice(key, t.n) }))
    .filter((x) => x.s > 0.45)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3);
  out.push({ round: r.round, title: r.title, diff: r.diff, designer: r.designer, candidates: scored });
}

fs.writeFileSync('_tmp/build/unmatched-suggest.json', JSON.stringify(out, null, 1), 'utf8');
for (const o of out) {
  const c = o.candidates.map((x) => x.t + '(' + x.s.toFixed(2) + ')').join(' , ') || '(站内没有相近曲名)';
  console.log(o.round + ' | ' + o.title + ' | ' + o.diff + ' → ' + c);
}
