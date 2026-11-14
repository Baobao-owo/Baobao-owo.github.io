// 把新曲的 wiki「譜面作者」写成谱师数据（tools/designer-song-credits.json）
// 同时在 chuni.json 里补上缺的 BPM / 版本 / 解禁日
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
if (fs.existsSync('tools/designer-wiki-aliases.json')) {
  for (const [credit, person] of Object.entries(JSON.parse(fs.readFileSync('tools/designer-wiki-aliases.json', 'utf8')))) {
    if (!alias2who.has(norm(credit))) alias2who.set(norm(credit), person);
  }
}
const manual = JSON.parse(fs.readFileSync('tools/designer-manual.json', 'utf8'));
for (const [bad, good] of Object.entries(manual.aliases || {})) alias2who.set(norm(bad), good);

function cleanToken(s) {
  return String(s || '')
    .replace(/\s*[*＊]\s*\d+\s*$/g, '')
    .replace(/^[\s:：・\-–—]+|[\s:：・\-–—]+$/g, '')
    .trim();
}
function resolve(token) {
  const t = cleanToken(token);
  if (!t) return '';
  return alias2who.get(norm(t)) || '';
}

const SONG = {
  'きゅうくらりん': { exp: 'そらいろカリン', mas: '一ノ瀬 リズ', ult: 'ミニミライト@Now everyone can be happy.' },
  'Your Reality (Kenji Mizuno Remix)': { exp: 'ロシェ@ペンギン', mas: 'aloe.chr' },
  'LaVI-Bavellabion': { exp: 'ミストルティン', mas: 'bloody-morpho' },
  '奇々解体': { exp: 'じゃこレモン', mas: 'ロシェ@調査員' },
  '狂命': { exp: 'そらいろカリン', mas: 'イノシカ提灯' },
};

const out = {};
for (const [title, d] of Object.entries(SONG)) {
  const entry = {};
  for (const [k, credit] of Object.entries(d)) {
    const diff = k === 'exp' ? 'e' : k === 'mas' ? 'm' : 'u';
    entry[diff] = { raw: credit, who: resolve(credit) || '' };
  }
  out[title] = entry;
  console.log(title, '=>', Object.entries(entry).map(([k, v]) => k + ': ' + (v.who || '(未认出)') + ' ⇐ ' + v.raw).join(' | '));
}
fs.writeFileSync('tools/designer-song-credits.json', JSON.stringify(out, null, 1) + '\n', 'utf8');

// 补 chuni.json 里缺的三项
const siteFile = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
const byT = new Map(site.songs.map((s) => [norm(s.title), s]));
const patches = {
  '狂命': { version: 'Mate', bpm: 220, release: '2026-10-29' },
  'きゅうくらりん': {},
  'Your Reality (Kenji Mizuno Remix)': {},
  'LaVI-Bavellabion': {},
  '奇々解体': {},
};
let fixed = 0;
for (const [title, patch] of Object.entries(patches)) {
  const s = byT.get(norm(title));
  if (!s) continue;
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (s[k] == null || s[k] === '') {
      s[k] = v;
      changed = true;
    }
  }
  if (changed) {
    fixed++;
    console.log('补字段:', title, JSON.stringify(patch));
  }
}
fs.writeFileSync(siteFile, JSON.stringify(site, null, 0), 'utf8');
console.log('chuni.json 补了', fixed, '首');
