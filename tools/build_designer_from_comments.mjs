// 从 chuni_extra 的 wiki 由来里抽「ND名義(难度)「クレジット」(人物)」
// 输出：tools/designer-from-comments.json
//   { "<规范化曲名>": { e: {credit, person}, m: {...}, u: {...} } }
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const cur = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    const k = norm(credit);
    if (!alias2who.has(k)) alias2who.set(k, person);
  }
}

const DIFF_CODE = {
  MAS: 'm', MASTER: 'm',
  EXP: 'e', EXPERT: 'e',
  ULT: 'u', ULTIMA: 'u',
  ADV: 'a', BAS: 'b',
};

const RE = /ND名義\s*[（(]([^）)]+)[）)]\s*[「『]([^」』]+)[」』]\s*(?:[（(]([^）)]*)[）)])?/g;

const out = {};
let hits = 0;
let withPerson = 0;
let withUnknown = 0;
const peopleSeen = new Map();

for (const [title, x] of Object.entries(extra)) {
  const text = [...(x.origins || []), String(x.wiki_comment || '')].join('\n');
  if (!/ND名義/.test(text)) continue;
  const key = norm(title);
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(text))) {
    const codeRaw = m[1].trim();
    const credit = m[2].trim();
    const paren = (m[3] || '').trim();
    // 只处理普通难度（WE 的各种花名先跳过）
    const diff = DIFF_CODE[codeRaw.toUpperCase()];
    if (!diff) continue;
    hits++;
    let person = '';
    if (/不明/.test(paren)) {
      withUnknown++;
    } else if (paren) {
      person = alias2who.get(norm(paren)) || '';
      if (!person) {
        // 括号里可能是简称/全名混写，再模糊试一次
        for (const [alias, who] of alias2who) {
          if (alias.length >= 3 && norm(paren).includes(alias)) {
            person = who;
            break;
          }
        }
      }
    }
    if (!person) {
      person = alias2who.get(norm(credit)) || '';
    }
    if (person) {
      withPerson++;
      peopleSeen.set(person, (peopleSeen.get(person) || 0) + 1);
    }
    out[key] = out[key] || {};
    if (!out[key][diff]) out[key][diff] = { credit, person, unknown: !person && /不明/.test(paren) };
  }
}

fs.writeFileSync('tools/designer-from-comments.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('ND名義 条目:', hits, ' 认出人的:', withPerson, ' 标了不明:', withUnknown, ' 涉及曲:', Object.keys(out).length);
console.log('人物分布前 10:', [...peopleSeen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + ':' + v).join(' | '));

// 看能补多少空白谱
let fillEmpty = 0;
const samples = [];
for (const [key, entry] of Object.entries(out)) {
  const siteEntry = cur.songs[key];
  for (const [diff, info] of Object.entries(entry)) {
    if (!info.person && !info.unknown) continue;
    const cell = siteEntry && siteEntry[diff];
    if (cell && cell.who) continue;
    fillEmpty++;
    if (samples.length < 8) samples.push(key + '.' + diff + ' → ' + (info.person || '制作者不明') + '（credit ' + info.credit + '）');
  }
}
console.log('能补的空白/杂名谱:', fillEmpty);
samples.forEach((s) => console.log('  ' + s));
