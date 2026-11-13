// 汇总 neta 普查结果：生成证据 JSON + 审阅 docx
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, '_tmp/neta-census');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));

const KW = ['元ネタ', 'モチーフ', 'パロディ', 'オマージュ', 'リスペクト', '称号', 'ND名義', '譜面', 'ボス', '原曲', 'セリフ', '引用'];
const GOOD_HOST = /wikiwiki|gamerch|atwiki|nicovideo|utaten|moegirl|bilibili|163|baidu/i;

const evidence = [];
for (const f of files) {
  let rec;
  try {
    rec = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  } catch (e) {
    continue;
  }
  const song = rec.song;
  const hits = [];
  let score = 0;
  for (const r of rec.results || []) {
    for (const h of r.hits || []) {
      const blob = (h.title || '') + ' ' + (h.snippet || '');
      let s = 0;
      if (blob.includes(song)) s += 3;
      for (const k of KW) if (blob.includes(k)) s += 1;
      if (GOOD_HOST.test(h.url || '')) s += 1;
      if (s <= 0) continue;
      score += s;
      hits.push({ q: r.q, title: h.title, url: h.url, snippet: h.snippet, s });
    }
  }
  if (!hits.length) {
    evidence.push({ song, score: 0, hits: [] });
    continue;
  }
  hits.sort((a, b) => b.s - a.s);
  evidence.push({ song, score, hits: hits.slice(0, 6) });
}

evidence.sort((a, b) => b.score - a.score);
fs.writeFileSync(path.join(ROOT, '_tmp/neta-evidence.json'), JSON.stringify(evidence, null, 1), 'utf8');
const withHits = evidence.filter((e) => e.hits.length).length;
console.log('汇总曲目', evidence.length, '| 有证据', withHits, '| 空', evidence.length - withHits);
console.log('高分样本:', evidence.slice(0, 5).map((e) => e.song + '(' + e.score + ')').join(' | '));
