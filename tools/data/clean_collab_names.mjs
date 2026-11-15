// 清理 collab.json 参与者名单：去括号注释、剔除非公开占位、拆开粘在一起的谱师名
import fs from 'node:fs';

const p = 'source/assets/data/collab.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
const D = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const names = D.designers.map((d) => d.name).sort((a, b) => b.length - a.length);

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '');

const JUNK = /^\(?(非公開|不明|unknown)\)?$/i;

function splitNames(text) {
  let t = String(text).replace(/[（(][^）)]*[）)]/g, '').trim();
  if (!t || JUNK.test(t)) return [];
  // 如果这个字段里塞了多个谱师名，按已知名字切出来
  const hits = [];
  let rest = t;
  for (const n of names) {
    if (rest.includes(n)) {
      hits.push({ n, i: rest.indexOf(n) });
    }
  }
  if (hits.length >= 2) {
    hits.sort((a, b) => a.i - b.i);
    return hits.map((x) => x.n);
  }
  return [t];
}

let changed = 0;
for (const rec of Object.values(c.songs || {})) {
  for (const k of Object.keys(rec)) {
    const out = [];
    for (const raw of rec[k] || []) {
      for (const n of splitNames(raw)) {
        if (!out.some((x) => norm(x) === norm(n))) out.push(n);
      }
    }
    if (JSON.stringify(out) !== JSON.stringify(rec[k])) changed++;
    if (out.length < 2) delete rec[k];
    else rec[k] = out;
  }
}

fs.writeFileSync(p, JSON.stringify(c, null, 1) + '\n', 'utf8');
console.log('清理的难度条目:', changed);
