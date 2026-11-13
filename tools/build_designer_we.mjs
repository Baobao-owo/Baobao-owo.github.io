// WE（WORLD'S END）谱师：从 chuni_extra 的「ND名義(WE…)「クレジット」」里抽，尽量认出人
// 输出：tools/designer-we.json  { "<曲名>": { credit, person } }
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));
const we = JSON.parse(fs.readFileSync('source/_data/chuni_we.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));

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

// WE 相关：ND名義(WE狂)「クレジット」 之类，难度码以 WE 开头
const RE = /ND名義\s*[（(](WE[^）)]*)[）)]\s*[「『]([^」』]+)[」』]/g;

const out = {};
let hits = 0;
let resolved = 0;
const resolvedSamples = [];

for (const [title, x] of Object.entries(extra)) {
  const text = [...(x.origins || []), String(x.wiki_comment || '')].join('\n');
  if (!/WE/.test(text)) continue;
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(text))) {
    const credit = m[2].trim();
    hits++;
    const person = alias2who.get(norm(credit)) || '';
    if (!out[title]) out[title] = { credit, person };
    if (person) {
      resolved++;
      if (resolvedSamples.length < 10) resolvedSamples.push(title + ' :: ' + credit + ' → ' + person);
    }
  }
}

fs.writeFileSync('tools/designer-we.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
const resolvedTitles = Object.values(out).filter((v) => v.person).length;
console.log('WE 署名条目:', hits, ' 认出人:', resolved, ' 涉及曲:', Object.keys(out).length, ' 其中认出的曲:', resolvedTitles);
resolvedSamples.forEach((s) => console.log('  ' + s));

// 对照 chuni_we.json 里的谱师串，看能不能直接对上人
const weNames = new Map();
for (const [title, info] of Object.entries(we.songs || {})) {
  const d = String(info.designer || '').trim();
  if (!d) continue;
  weNames.set(norm(title), { raw: d, person: alias2who.get(norm(d)) || '' });
}
let weResolved = 0;
for (const v of weNames.values()) if (v.person) weResolved++;
console.log('chuni_we.json 共', weNames.size, ' 其中谱师串能直接认成人:', weResolved);
