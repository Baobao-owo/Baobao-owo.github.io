// 用 wiki「譜面制作者一覧1〜6」生成别名表：クレジット名 → 谱师
// 输入：_tmp/wiki/designer-map-all.json
// 输出：tools/designer-wiki-aliases.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const sections = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const cur = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
const curNames = [...new Set(cur.designers.filter((d) => !d.pseudo).map((d) => d.name))];

function resolvePerson(h) {
  const base = String(h || '').replace(/Font Awesome.*$/i, '').trim();
  const variants = [base, base.replace(/[（(].*?[）)]\s*$/, '').trim(), base.replace(/\s*\/.*$/, '').trim()];
  for (const v of variants) {
    if (!v) continue;
    const who = alias2who.get(norm(v));
    if (who) return who;
    const hit = curNames.find((n) => norm(n) === norm(v));
    if (hit) return hit;
  }
  return '';
}

// 团队 / 合作 / 不明 类署名不并入个人
const TEAMISH = /(ボーイズ|チーム|Team|団|委員会|ユニット|Unit|組|教団|怪盗団|vs|VS|＆|&|\+|with|supported by|feat|合作|不明|有志|一同)/i;

const out = {};
let sectionsMatched = 0;
let sectionsSkipped = 0;
let creditsSkipped = 0;

for (const s of sections) {
  const person = resolvePerson(s.heading);
  if (!person) {
    sectionsSkipped++;
    continue;
  }
  sectionsMatched++;
  for (const r of s.rows) {
    const credit = String(r.credit || '').trim();
    if (!credit) continue;
    if (norm(credit) === norm(person)) continue;
    if (TEAMISH.test(credit)) {
      creditsSkipped++;
      continue;
    }
    if (!out[credit]) out[credit] = person;
  }
}

fs.writeFileSync('tools/designer-wiki-aliases.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('命中谱师的小节:', sectionsMatched, ' 跳过小节:', sectionsSkipped);
console.log('别名条目:', Object.keys(out).length, ' 跳过（团队/合作类）:', creditsSkipped);

// 预估能收回多少其他名义
const looseNames = new Set(cur.loose.map((x) => norm(x.name)));
let hit = 0;
for (const k of Object.keys(out)) if (looseNames.has(norm(k))) hit++;
console.log('能归回的其他名义:', hit, '/', looseNames.size);
