// 严格版证据：要求曲名命中 + 关键词命中，低置信单独分离
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIRS = ['_tmp/neta-census', '_tmp/neta-census2'];
const KW = ['元ネタ', 'モチーフ', 'パロディ', 'オマージュ', 'リスペクト', '称号', 'ND名義', '譜面', '原曲', 'セリフ', '収録', '移植', 'コラボ'];
const TRUSTED = /wikiwiki|gamerch|atwiki|utaten|nicovideo|moegirl|bilibili|baike\.baidu|zhihu|note\.com|twitter\.com|x\.com/i;

function norm(s) {
  return String(s).normalize('NFKC').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');
}

const files = [];
for (const d of DIRS) {
  const p = path.join(ROOT, d);
  if (!fs.existsSync(p)) continue;
  for (const f of fs.readdirSync(p)) if (f.endsWith('.json')) files.push(path.join(p, f));
}

const strict = [];
const weak = [];
for (const f of files) {
  let rec;
  try {
    rec = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    continue;
  }
  const song = rec.song;
  const ns = norm(song);
  const core = norm(song.replace(/[（(].*?[)）]/g, ''));
  const good = [];
  const rest = [];
  for (const r of rec.results || []) {
    for (const h of r.hits || []) {
      const blob = norm((h.title || '') + (h.snippet || ''));
      const titleHit = (ns.length >= 3 && blob.includes(ns)) || (core.length >= 3 && blob.includes(core));
      let kw = 0;
      const raw = (h.title || '') + ' ' + (h.snippet || '');
      for (const k of KW) {
        if (raw.includes(k)) kw++;
      }
      const trusted = TRUSTED.test(h.url || '');
      if (titleHit && (kw > 0 || trusted)) {
        good.push({ ...h, score: 3 + kw + (trusted ? 1 : 0) });
      } else {
        rest.push({ ...h, score: titleHit ? 1 : 0 });
      }
    }
  }
  if (good.length) {
    good.sort((a, b) => b.score - a.score);
    strict.push({ song, score: good.reduce((a, x) => a + x.score, 0), hits: good.slice(0, 5) });
  } else if (rest.length) {
    weak.push({ song, hits: rest.slice(0, 3) });
  }
}

strict.sort((a, b) => b.score - a.score);
fs.writeFileSync(path.join(ROOT, '_tmp/neta-evidence-strict.json'), JSON.stringify({ strict, weak }, null, 1), 'utf8');
console.log('高置信', strict.length, '| 低置信', weak.length, '| 总', files.length);
console.log('高置信样本:', strict.slice(0, 8).map((e) => e.song + '(' + e.score + ')').join(' | '));
