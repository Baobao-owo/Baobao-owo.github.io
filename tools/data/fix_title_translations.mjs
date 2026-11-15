// 修称号条件里几处明显的机翻错误
//   1) 「MASTER以下全て/プレイ」被翻成「全部位于主控/播放下方」→ MASTER 及以下全部/游玩
//   2) FULL CHAIN 被翻成「全链条」→ 全连
//   3) 残留的 プレイ → 播放 → 游玩
import fs from 'node:fs';

const FILE = 'source/_data/chuni_extra.json';
const ex = JSON.parse(fs.readFileSync(FILE, 'utf8'));

let fixedRows = 0;
let fixedText = 0;

function fixText(s) {
  let out = String(s);
  const before = out;
  out = out.replace(/全部位于主控\/播放下方/g, 'MASTER 及以下全部/游玩');
  out = out.replace(/MASTER及以下所有/g, 'MASTER 及以下全部');
  out = out.replace(/实现全链条/g, '达成全连');
  out = out.replace(/全链条/g, '全连');
  out = out.replace(/播放/g, '游玩');
  if (out !== before) fixedText++;
  return out;
}

for (const [title, v] of Object.entries(ex)) {
  const ja = v.titles || [];
  const zh = v.titles_zh || [];
  if (!zh.length) continue;
  for (let i = 0; i < zh.length; i++) {
    for (let c = 0; c < zh[i].length; c++) {
      const jaCell = ja[i] && ja[i][c] ? String(ja[i][c]) : '';
      let cell = String(zh[i][c] || '');
      if (!cell) continue;
      // 条件列里「X以下全て/プレイ」的句式，按日文重写
      const m = jaCell.match(/^\s*(.+?)以下全て\s*\/\s*プレイ\s*$/);
      if (m) {
        const lv = m[1].trim();
        const newCell = lv + ' 及以下全部/游玩';
        if (cell !== newCell) {
          zh[i][c] = newCell;
          fixedRows++;
          continue;
        }
      }
      const fixed = fixText(cell);
      if (fixed !== cell) {
        zh[i][c] = fixed;
        fixedRows++;
      }
    }
  }
  v.titles_zh = zh;
}

fs.writeFileSync(FILE, JSON.stringify(ex), 'utf8');
console.log('修正单元格:', fixedRows, ' 文本级替换次数:', fixedText);
const sample = ex['鳥の詩'];
console.log('鳥の詩 前两行:', JSON.stringify((sample.titles_zh || []).slice(1, 3)));
