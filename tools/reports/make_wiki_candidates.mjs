import fs from 'node:fs';

const titles = JSON.parse(fs.readFileSync('_tmp/wiki/crawl_titles.json', 'utf8'));
const failed = [
  '1/3の純情な感情',
  'Scatman(Ski Ba Bop Ba Dop Bop)',
  'WHITE ALBUMLive at Campus Fes',
  'Little Busters!～TV animation ver.～',
  'secret base～君がくれたもの～(10 years after Ver.)',
  'クローバー&#9827;かくめーしょん',
  'L.L.L.',
  'U.S.A.',
  'Don\u2019t say "lazy"',
  'めいど・うぃず・どらごんず&#9829;',
  '失礼しますが、RIP&#9825;',
  'Signs Of Love(\u201cNever More\u201d ver.)',
  'Your Affection(Daisuke Asakura Remix)',
  '&#93;-&#91;&#124;/34<&#35;!',
];

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function variants(raw) {
  const base = decodeEntities(raw).normalize('NFKC');
  const out = new Set();
  const add = (s) => {
    const t = String(s).trim();
    if (t) out.add(t);
  };
  add(base);
  add(raw);
  // 波浪号/引号/括号的常见变体
  const swaps = [
    ['～', '〜'],
    ['～', '~'],
    ['〜', '～'],
    ['“', '「'],
    ['”', '」'],
    ['“', '"'],
    ['”', '"'],
    ['(', '（'],
    [')', '）'],
    ['（', '('],
    ['）', ')'],
  ];
  for (const [a, b] of swaps) {
    if (base.includes(a)) add(base.split(a).join(b));
  }
  // 引号包裹 & 去空格
  add(base.replace(/\s+/g, ''));
  add(base.replace(/\s*([!?！？])/g, '$1'));
  return [...out];
}

const result = [];
for (const t of failed) {
  const idx = titles.indexOf(t) + 1;
  result.push({ title: t, index: idx, candidates: variants(t) });
}

fs.writeFileSync('_tmp/wiki/candidates.json', JSON.stringify(result, null, 1), 'utf8');
console.log('生成候选:', result.length, '组');
result.slice(0, 3).forEach((r) => console.log('  #' + r.index, r.title, '→', JSON.stringify(r.candidates)));
