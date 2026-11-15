// 从 wiki 由来里抽 WE 谱的 ND 名义，按「属性字」精确对应后贴回 chuni_we.json
// 例：ND名義(WE狂)「狂っててごめん」 → 属性「狂」的那张 WE 谱
//      WE名義「Demon's Cry」     → 没有属性字，只在唯一候选时使用
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));
const WE_FILE = 'source/_data/chuni_we.json';
const we = JSON.parse(fs.readFileSync(WE_FILE, 'utf8'));

const byNorm = new Map();
for (const k of Object.keys(we.songs || {})) byNorm.set(norm(k), k);

// 去掉星号脚注、书名号残留
function clean(s) {
  return String(s || '')
    .replace(/\s*[*＊]\s*\d+\s*$/g, '')
    .replace(/^[\s「『]+|[\s」』]+$/g, '')
    .trim();
}

const CODED = /ND名義\s*[（(]WE\s*([^）)]*)[）)]\s*[「『]([^」』]+)[」』]/g;
const PLAIN = /(?<!ND名義\s*[（(]WE\s*)WE名義\s*[「『]([^」』]+)[」』]/g;

const coded = new Map(); // title -> Map(attrChar -> credit)
const plain = new Map(); // title -> [credit]

for (const [title, x] of Object.entries(extra)) {
  const text = [...(x.origins || []), String(x.wiki_comment || '')].join('\n');
  if (!/WE/.test(text)) continue;
  let m;
  CODED.lastIndex = 0;
  while ((m = CODED.exec(text))) {
    const code = clean(m[1]);
    const attrChar = code.replace(/[0-9０-９☆★]/g, '').trim().slice(0, 1);
    if (!coded.has(title)) coded.set(title, new Map());
    if (!coded.get(title).has(attrChar)) coded.get(title).set(attrChar, clean(m[2]));
  }
  PLAIN.lastIndex = 0;
  while ((m = PLAIN.exec(text))) {
    if (!plain.has(title)) plain.set(title, []);
    plain.get(title).push(clean(m[1]));
  }
}

let updated = 0;
let skipped = 0;
const report = [];
for (const [title, credits] of coded) {
  const key = byNorm.get(norm(title));
  if (!key) continue;
  const attr = String(we.songs[key].attr || '').trim().slice(0, 1);
  const credit = credits.get(attr);
  if (!credit) {
    skipped++;
    continue;
  }
  const cur = we.songs[key].designer || '';
  if (cur === credit) continue;
  report.push(key + '（' + we.songs[key].attr + '）: 「' + cur + '」→「' + credit + '」');
  we.songs[key].designer = credit;
  updated++;
}

// 没有属性字的：只在确实只有一种 WE 名义时采用
for (const [title, list] of plain) {
  const key = byNorm.get(norm(title));
  if (!key) continue;
  if (coded.has(title)) continue;
  const uniq = [...new Set(list)];
  if (uniq.length !== 1) continue;
  const cur = we.songs[key].designer || '';
  if (cur === uniq[0]) continue;
  report.push(key + '（' + we.songs[key].attr + '）: 「' + cur + '」→「' + uniq[0] + '」（无属性字）');
  we.songs[key].designer = uniq[0];
  updated++;
}

fs.writeFileSync(WE_FILE, JSON.stringify(we, null, 1) + '\n', 'utf8');
console.log('更新的 WE 谱:', updated, ' 属性字没对上的:', skipped, ' 已匹配曲目:', coded.size);
report.slice(0, 15).forEach((r) => console.log('  ' + r));
