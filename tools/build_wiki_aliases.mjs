// 用 wiki「譜面製作者一覧1」生成别名表：クレジット名 → 谱师
// 输出：tools/designer-wiki-aliases.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const people = JSON.parse(fs.readFileSync('_tmp/wiki/designer1-map.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const cur = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
const curNames = [...new Set(cur.designers.filter((d) => !d.pseudo).map((d) => d.name))];
const curSet = new Set(curNames.map(norm));

function cleanHeading(h) {
  return String(h || '')
    .replace(/Font Awesome.*$/i, '')
    .trim();
}
function resolvePerson(h) {
  const variants = [h, h.replace(/[（(].*?[）)]\s*$/, '').trim()];
  for (const v of variants) {
    const who = alias2who.get(norm(v));
    if (who) return who;
    const hit = curNames.find((n) => norm(n) === norm(v));
    if (hit) return hit;
  }
  return '';
}

// 团队/合作/不明 这类不当作个人别名
const TEAMISH = /(ボーイズ|チーム|Team|団|委員会|ユニット|Unit|組|教団|怪盗団|vs|VS|＆|&|\+|with|supported by|feat)/i;

const out = {};
let skipped = 0;
for (const p of people) {
  const person = resolvePerson(cleanHeading(p.heading));
  if (!person) continue;
  for (const c of p.credits) {
    const credit = String(c || '').trim();
    if (!credit) continue;
    if (norm(credit) === norm(person)) continue;
    if (TEAMISH.test(credit)) {
      skipped++;
      continue;
    }
    if (!out[credit]) out[credit] = person;
  }
}

fs.writeFileSync('tools/designer-wiki-aliases.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('别名条目:', Object.keys(out).length, ' 跳过（看起来是合作/团队）:', skipped);

// 看看能收回多少 loose
const loose = cur.loose.map((x) => x.name);
let hit = 0;
const sample = [];
for (const name of loose) {
  if (out[name] || Object.keys(out).some((k) => norm(k) === norm(name))) {
    hit++;
    if (sample.length < 8) sample.push(name + ' → ' + (out[name] || ''));
  }
}
console.log('能归回的其他名义:', hit, '/', loose.length);
sample.forEach((s) => console.log('  ' + s));
