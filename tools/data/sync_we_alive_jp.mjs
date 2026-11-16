// 按 wiki 的 WORLD'S END 列表设置日服 WE 谱的存活标记（delJP）
// 依据：wiki 页面列出的 WE 谱 = 日服当前可玩；灰色底纹只是表格配色，不代表删除。
// 前置：先跑 node tools/data/sync_we_from_wiki.mjs（生成 _tmp/wiki/worldsend-table.json）
// 用法：node tools/data/sync_we_alive_jp.mjs [--write]
import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const norm = (t) => String(t).normalize('NFKC').toLowerCase().replace(/\s+/g, '');

const tablePath = '_tmp/wiki/worldsend-table.json';
if (!fs.existsSync(tablePath)) {
  console.error('缺少 ' + tablePath + '，先跑 node tools/data/sync_we_from_wiki.mjs');
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
const wePath = 'source/_data/chuni_we.json';
const we = JSON.parse(fs.readFileSync(wePath, 'utf8'));
if (!we.byId) {
  console.error('chuni_we.json 没有 byId');
  process.exit(1);
}

// 同曲可能有多张 WE 谱：优先取属性一致，其次星数一致，都一致就都算存活
const byTitle = new Map();
for (const [id, e] of Object.entries(we.byId)) {
  const k = norm(e.title);
  if (!byTitle.has(k)) byTitle.set(k, []);
  byTitle.get(k).push({ id, e });
}
for (const list of byTitle.values()) for (const x of list) x.e.delJP = 1;

let alive = 0;
const picked = [];
for (const r of rows) {
  const list = byTitle.get(norm(r.title)) || [];
  if (!list.length) continue;
  let cand = list.filter((x) => x.e.attr === r.attr);
  if (!cand.length) cand = list.filter((x) => Number(x.e.stars) === Number(r.stars));
  if (!cand.length) cand = [list[0]];
  const exact = cand.filter((x) => Number(x.e.stars) === Number(r.stars));
  if (exact.length) cand = exact;
  for (const x of cand) {
    x.e.delJP = 0;
    alive++;
    picked.push({ id: x.id, title: x.e.title, attr: x.e.attr, stars: x.e.stars });
  }
}

const wikiNorm = new Set(rows.map((r) => norm(r.title)));
let pseudoAlive = 0;
for (const [t, ps] of Object.entries(we.pseudo || {})) {
  ps.jp = wikiNorm.has(norm(t)) ? 1 : 0;
  if (ps.jp) pseudoAlive++;
}

const deleted = Object.keys(we.byId).length - alive;
console.log(`wiki 行数 ${rows.length}；日服存活 byId ${alive}、pseudo ${pseudoAlive}；已删 byId ${deleted}`);

fs.mkdirSync('_tmp/reports', { recursive: true });
fs.writeFileSync(
  '_tmp/reports/we-alive-jp.tsv',
  picked.map((p) => [p.id, p.title, p.attr, p.stars].join('\t')).sort().join('\n'),
  'utf8'
);

if (!WRITE) {
  console.log('写回 否（加 --write）');
} else {
  fs.writeFileSync(wePath, JSON.stringify(we), 'utf8');
  console.log('已写回 ' + wePath);
}
