// 用 wiki「配信終了」全量比对，把漏标的补进 chuni_removed.json
// 用法：node tools/mark_deleted_from_wiki.mjs [--apply]
import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');

const decode = (s) =>
  String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

const norm = (s) =>
  decode(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&]/g, '');

const rows = JSON.parse(fs.readFileSync('_tmp/wiki/deleted_songs.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const REMOVED = 'source/_data/chuni_removed.json';
const rm = JSON.parse(fs.readFileSync(REMOVED, 'utf8').replace(/^\uFEFF/, ''));
const already = new Set((rm.matched || []).map((x) => String(x.id)));

const SKIP = new Set(["WORLD'S END", 'International ver.でのみ配信終了となった楽曲', 'エイプリルフール限定譜面']);
const DATE = /^\d{4}\/\d{1,2}\/\d{1,2}/;

// 先按曲名收集 wiki 行；若某曲名只出现在「復活日付」表，就判为已复活
const byNorm = new Map();
for (const r of rows) {
  if (!r.section || SKIP.has(r.section)) continue;
  const t = (r.cells && r.cells[0]) || '';
  if (!t || t === 'タイトル' || t.startsWith('▼')) continue;
  const key = norm(t);
  if (!byNorm.has(key)) byNorm.set(key, []);
  byNorm.get(key).push(r);
}

function onlyRevived(list) {
  return list.every((r) => {
    const cells = r.cells || [];
    return cells.slice(3).some((c) => DATE.test(String(c || '').trim()));
  });
}

const additions = [];
for (const s of data.songs) {
  if (already.has(String(s.id))) continue;
  const list = byNorm.get(norm(s.title));
  if (!list) continue;
  if (onlyRevived(list)) continue;
  additions.push({ id: s.id, title: s.title });
}

console.log('wiki 停配曲名:', byNorm.size, '| 站内已标删除:', already.size, '| 本次补:', additions.length);
additions.forEach((a) => console.log('  + ' + a.title));

if (APPLY && additions.length) {
  rm.matched = (rm.matched || []).concat(additions.map((a) => ({ id: a.id, title: a.title })));
  fs.writeFileSync(REMOVED, JSON.stringify(rm, null, 1) + '\n', 'utf8');
  console.log('已写入 chuni_removed.json，matched 现在', rm.matched.length);
}
