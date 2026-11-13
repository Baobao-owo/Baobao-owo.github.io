// 重建术语表：种子（沿用现有）+ 自动候选 + 补译名 + 谱师名义识别
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8').replace(/^\uFEFF/, ''));
const perSong = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_designers.json'), 'utf8'));
const designersAll = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/designers-all.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/chuni-glossary.json'), 'utf8'));

// 现有种子（90 条）
const seed = current.seed;

// 补译名映射（从 glossary_auto_fill.mjs 里读出来）
const fillSrc = fs.readFileSync(path.join(ROOT, 'tools/glossary_auto_fill.mjs'), 'utf8');
const fm = fillSrc.match(/const FILL = (\{[\s\S]*?\n\});/);
const FILL = fm ? eval('(' + fm[1] + ')') : {};
const FILL2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/glossary-fill2.json'), 'utf8'));
Object.assign(FILL, FILL2);
const FILL3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/glossary-fill3.json'), 'utf8'));
Object.assign(FILL, FILL3);
console.log('FILL 条目:', Object.keys(FILL).length);

// 谱师名义词典
const lexicon = new Map();
for (const d of designersAll) {
  lexicon.set(d.name, d.name);
  for (const line of d.profile || []) {
    const m = line.match(/^(漢字表記|別名義|英字表記)[：:]\s*(.+)$/);
    if (!m) continue;
    for (const raw of m[2].split(/[、,／\/]/)) {
      const name = raw.replace(/\*\d+/g, '').trim();
      if (!name || name.length < 2 || /について/.test(name)) continue;
      lexicon.set(name, d.name);
    }
  }
}
for (const v of Object.values(perSong)) {
  for (const name of Object.values(v)) {
    const s = String(name || '').trim();
    if (s && s !== '-' && s.length >= 2) lexicon.set(s, lexicon.get(s) || s);
  }
}

function designerHit(term, kind) {
  if (kind !== '名称' && kind !== '待定') return '';
  if (term.length < 6) return '';
  const t = term.normalize('NFKC').toLowerCase();
  for (const n of lexicon.keys()) {
    const nn = n.normalize('NFKC').toLowerCase();
    if (nn === t) return n;
    if (t.length >= 3 && nn.includes(t) && nn.length >= t.length + 2) return n;
  }
  return '';
}

// 语料频次
const text = Object.values(extra)
  .map((e) => [e.wiki_comment, ...(e.origins || []), ...(e.titles || []).map((r) => r.join(' '))].join('\n'))
  .join('\n');

function count(term) {
  if (!term) return 0;
  let c = 0;
  let i = 0;
  while ((i = text.indexOf(term, i)) !== -1) {
    c++;
    i += term.length;
  }
  return c;
}

const known = new Set(seed.map((r) => r.jp));
const freq = new Map();
for (const m of text.matchAll(/[ァ-ヶー]{3,}/g)) {
  const w = m[0];
  if (known.has(w)) continue;
  freq.set(w, (freq.get(w) || 0) + 1);
}

const auto = [];
const designerTerms = [];
for (const [w, c] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  if (c < 5) continue;
  const f = FILL[w];
  const base = {
    jp: w,
    occurrences: c,
    zh: f ? f[0] : '',
    kind: f ? f[1] : '待定'
  };
  const hit = designerHit(w, base.kind);
  if (hit) {
    base.kind = '谱师名义';
    base.zh = '谱师：' + hit;
    designerTerms.push(base);
  } else if (base.kind === '谱师名义') {
    designerTerms.push(base);
  } else {
    auto.push(base);
  }
  if (auto.length >= 200) break;
}

fs.writeFileSync(
  path.join(ROOT, '_tmp/chuni-glossary.json'),
  JSON.stringify({ seed, auto, designerTerms }, null, 1),
  'utf8'
);
console.log('种子:', seed.length, '| 术语/名称候选:', auto.length, '| 谱师名义:', designerTerms.length);
console.log('谱师名义样本:', designerTerms.slice(0, 12).map((x) => x.jp + '→' + x.zh).join(' | '));
