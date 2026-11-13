// 用「单元格翻译」重建称号表：逐格查表，严格对齐
import fs from 'node:fs';

const ROOT = process.cwd();
const EXTRA = ROOT + '/source/_data/chuni_extra.json';
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));

function readJsonlMap(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const raw of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) continue;
    const i = line.indexOf('\t');
    if (i < 0) continue;
    map.set(line.slice(0, i).trim(), line.slice(i + 1).replace(/⏎/g, '\n').trim());
  }
  return map;
}

function loadSrc(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function fixTerm(s) {
  return String(s || '').split('危险技能启动').join('触发危险技能');
}

const titlesSrc = loadSrc(ROOT + '/tools/queues/cells-titles-src.json');
const condsSrc = loadSrc(ROOT + '/tools/queues/cells-conds-src.json');
const titlesZh = readJsonlMap(ROOT + '/tools/out/cells-titles-zh.jsonl');
const condsZh = readJsonlMap(ROOT + '/tools/out/cells-conds-zh.jsonl');

const titleMap = new Map();
titlesSrc.forEach((jp, i) => {
  const zh = titlesZh.get(String(i));
  if (zh) titleMap.set(jp, fixTerm(zh));
});
const condMap = new Map();
condsSrc.forEach((jp, i) => {
  const zh = condsZh.get(String(i));
  if (zh) condMap.set(jp, fixTerm(zh));
});

console.log('称号词典:', titleMap.size, '/', titlesSrc.length, '| 条件词典:', condMap.size, '/', condsSrc.length);

let done = 0;
let missing = 0;
for (const e of Object.values(extra)) {
  if (!e.titles || e.titles.length < 2) continue;
  const head = e.titles[0];
  const rows = e.titles.slice(1).map((row) => {
    const t = String(row[0] || '').trim();
    const c = String(row[1] || '').trim();
    const zt = titleMap.get(t);
    const zc = condMap.get(c);
    if (!zt) missing++;
    return [zt || t, zc || c];
  });
  e.titles_zh = [head].concat(rows);
  done++;
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
console.log('重建称号表:', done, '首 | 未命中格子:', missing);
console.log('sample:', JSON.stringify(extra['千本桜'] && extra['千本桜'].titles_zh));
