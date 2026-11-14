// 手动改某张谱在站点上的谱师署名（同时同步谱师筛选数据）
// 用法: node tools/set_sheet_designer.mjs "曲名" m "名字"
import fs from 'node:fs';

const [title, diff, name] = process.argv.slice(2);
if (!title || !diff || !name) {
  console.error('用法: node tools/set_sheet_designer.mjs "曲名" 难度字母(B/A/E/M/U) "署名"');
  process.exit(1);
}
const MAP = { b: 'basic', a: 'advanced', e: 'expert', m: 'master', u: 'ultima' };
const target = MAP[diff.toLowerCase()] || diff;
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const FILE = 'source/_data/chuni.json';
const site = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const song = site.songs.find((s) => norm(s.title) === norm(title));
if (!song) {
  console.log('曲库找不到:', title);
  process.exit(1);
}
const sheet = song.sheets.find((s) => s.difficulty === target);
if (!sheet) {
  console.log('这张谱不存在:', target);
  process.exit(1);
}
const before = sheet.designer;
sheet.designer = name;
fs.writeFileSync(FILE, JSON.stringify(site), 'utf8');
console.log('页面署名:', before, '→', name);

// 谱师筛选数据
const D = 'source/assets/data/designers.json';
const d = JSON.parse(fs.readFileSync(D, 'utf8'));
const key = Object.keys(d.songs).find((k) => norm(k) === norm(title));
if (key) {
  const letter = Object.keys(MAP).find((k) => MAP[k] === target);
  d.songs[key][letter] = { who: name, raw: name };
  fs.writeFileSync(D, JSON.stringify(d, null, 0), 'utf8');
  console.log('筛选数据已同步:', key, letter, name);
} else {
  console.log('筛选数据里没有这首:', title);
}
