// 修正种子词 + 补充社区用语（取自萌百「音乐游戏/用语」）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const file = path.join(ROOT, '_tmp/chuni-glossary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const FIX = {
  ゲージ: '能量槽',
  クレジット: '投币（Credit）',
  クラス認定: 'CLASS 认定',
  ジャケット: '曲绘（封面）',
  パロディ: '恶搞 / 戏仿',
  配信停止: '停止配信（下架）',
  店舗: '店铺（机厅）'
};
for (const r of data.seed) {
  if (FIX[r.jp]) r.zh = FIX[r.jp];
}

const EXTRA = [
  ['社区用语', '初見', '初见', '第一次游玩谱面'],
  ['社区用语', '初見殺し', '初见杀', '初见时必吃瘪的局部难点'],
  ['社区用语', '尾殺', '尾杀', '结尾处的高难度段落'],
  ['社区用语', '局所難', '局所难', '某个特定段落难度极高'],
  ['社区用语', '発狂', '发狂段', '密集音符段落'],
  ['社区用语', '混フレ', '混FR（混合声部）', '对多个声部同时采音'],
  ['社区用语', '採音', '采音', '决定采用哪些音写谱'],
  ['社区用语', '配置', '配置 / 键型', '音符的空间排列组合'],
  ['社区用语', '譜面停止', '谱面停止', '谱面停止流动'],
  ['社区用语', 'ソフラン', '变速（soft landing）', '谱面流速变化'],
  ['社区用语', '詐称', '诈称', '实际难度高于标定'],
  ['社区用语', '収歌', '收歌', '取得满分/理论值'],
  ['社区用语', '鳥', '鸟', 'SSS 级别高分（源自日文）'],
  ['社区用语', 'フルコン', 'FC（全连）', 'Full Combo'],
  ['社区用语', '理論値', '理论值', '满分成绩'],
  ['社区用语', 'AP', 'AP（全正）', 'All Perfect'],
  ['社区用语', 'ズレ', 'zure（音画偏差）', '谱面对不上音']
];

const text = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8')))
  .map((e) => [e.wiki_comment, ...(e.origins || []), ...(e.titles || []).map((r) => r.join(' '))].join('\n'))
  .join('\n');

function count(term) {
  let c = 0;
  let i = 0;
  while ((i = text.indexOf(term, i)) !== -1) {
    c++;
    i += term.length;
  }
  return c;
}

const have = new Set(data.seed.map((r) => r.jp));
for (const [cat, jp, zh, note] of EXTRA) {
  if (have.has(jp)) continue;
  data.seed.push({ category: cat, jp, zh, note, occurrences: count(jp) });
  have.add(jp);
}

fs.writeFileSync(file, JSON.stringify(data, null, 1), 'utf8');
console.log('种子:', data.seed.length);
console.log('新增示例:', data.seed.slice(-5).map((r) => r.jp + '→' + r.zh).join(' | '));
