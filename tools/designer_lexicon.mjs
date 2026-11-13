// 用谱师 wiki 的 62 位谱师名 + chuni_designers.json 的谱面署名，构建谱师名义词典
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const all = JSON.parse(fs.readFileSync(path.join(ROOT, '_tmp/designers-all.json'), 'utf8'));
const perSong = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_designers.json'), 'utf8'));

const lexicon = new Map(); // 名义 -> 归属说明

for (const d of all) {
  lexicon.set(d.name, d.name);
  for (const line of d.profile || []) {
    const m = line.match(/^(漢字表記|別名義|英字表記)[：:]\s*(.+)$/);
    if (!m) continue;
    for (const raw of m[2].split(/[、,／\/]/)) {
      const name = raw.replace(/\*\d+/g, '').trim();
      if (!name || name.length < 2) continue;
      if (/について/.test(name)) continue;
      lexicon.set(name, d.name);
    }
  }
}

// 每首谱面的署名（含各种比名、梗名）
for (const v of Object.values(perSong)) {
  for (const name of Object.values(v)) {
    const s = String(name || '').trim();
    if (s && s !== '-' && s.length >= 2) lexicon.set(s, lexicon.get(s) || s);
  }
}

const names = [...lexicon.keys()];

function fragments(term) {
  const hits = [];
  const t = term.normalize('NFKC').toLowerCase();
  for (const n of names) {
    const nn = n.normalize('NFKC').toLowerCase();
    if (nn === t) {
      hits.push({ exact: true, name: n });
    } else if (t.length >= 3 && nn.includes(t) && nn.length >= t.length + 2) {
      hits.push({ exact: false, name: n });
    }
  }
  return hits;
}

const file = path.join(ROOT, '_tmp/chuni-glossary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let moved = 0;
const remaining = [];
for (const a of data.auto) {
  // 只对「名称类」做谱师名义判定；已经定为术语/作品的不动
  if (a.kind !== '名称') {
    remaining.push(a);
    continue;
  }
  const hits = fragments(a.jp);
  if (hits.length) {
    a.kind = '谱师名义';
    a.zh = '谱师：' + hits[0].name;
    moved++;
  }
  remaining.push(a);
}
// 谱师名义单独表，其余保留
data.auto = remaining.filter((a) => a.kind !== '谱师名义');
data.designerTerms = remaining.filter((a) => a.kind === '谱师名义');

fs.writeFileSync(file, JSON.stringify(data, null, 1), 'utf8');
console.log('谱师名义词典:', names.length);
console.log('候选里识别为谱师名义:', moved);
console.log('样本:', data.designerTerms.slice(0, 15).map((x) => x.jp + '→' + x.zh).join(' | '));
console.log('剩余候选:', data.auto.length, '| 剩余术语:', data.auto.filter((a) => a.kind === '术语' || a.kind === '作品').length);
