// 重建术语表：修正エクストラトラック译名，过滤掉谱师名噪声
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8').replace(/^\uFEFF/, ''));
const designers = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_designers.json'), 'utf8'));
const designerInfo = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_designers_info.json'), 'utf8').replace(/^\uFEFF/, ''));

const SEED = [
  ['谱面基础', '譜面', '谱面', ''],
  ['谱面基础', '定数', '定数', ''],
  ['谱面基础', '内部値', '内部值', '谱面定数的内部数值'],
  ['谱面基础', '物量', '物量', ''],
  ['谱面基础', 'ノーツ', '音符', ''],
  ['谱面基础', 'ノーツデザイナー', '谱师（ND）', ''],
  ['谱面基础', 'ND名義', 'ND 名义', '谱师署名'],
  ['谱面基础', 'タップ', 'TAP', ''],
  ['谱面基础', 'ホールド', 'HOLD', ''],
  ['谱面基础', 'スライド', 'SLIDE', ''],
  ['谱面基础', 'エアー', 'AIR', ''],
  ['谱面基础', 'フリック', 'FLICK', ''],
  ['谱面基础', 'エアクラッシュ', 'AIR-CRUSH', ''],
  ['谱面基础', 'エクストラトラック', '额外曲目（extra track）', '隐藏加曲，如 RE:VERSE 完走后的特别曲'],
  ['谱面基础', 'フィールドウォール', '背景板', '曲目专用的场地背景板'],
  ['谱面基础', 'ジャンル', '曲风分类', ''],
  ['谱面基础', 'ロング', '长曲', ''],
  ['谱面基础', 'リミックス', 'Remix', ''],
  ['谱面基础', 'アレンジ', '改编（arrange）', ''],
  ['谱面基础', 'インスト', '纯音乐', ''],
  ['谱面基础', 'ボーカル', '人声', ''],
  ['成绩', 'フルコンボ', 'FULL COMBO', ''],
  ['成绩', 'オールジャスティス', 'ALL JUSTICE', ''],
  ['成绩', 'ランク', 'RANK', ''],
  ['成绩', '判定', '判定', ''],
  ['成绩', 'レーティング', 'Rating', ''],
  ['成绩', 'クリア', '通关', ''],
  ['成绩', 'ゲージ', '计量条', ''],
  ['成绩', 'スキル', '技能', ''],
  ['系统', '解禁', '解锁', ''],
  ['系统', '配信', '配信', ''],
  ['系统', '配信停止', '停止配信', ''],
  ['系统', '稼動', '稼动（上线）', ''],
  ['系统', 'バージョン', '版本', ''],
  ['系统', '筐体', '机台', ''],
  ['系统', '店舗', '店铺', ''],
  ['系统', 'クレジット', '1 枚币（credit）', ''],
  ['系统', 'チケット', '票券', ''],
  ['系统', 'マップ', '地图', ''],
  ['系统', 'マップボーナス', '地图加成', ''],
  ['系统', 'イベント', '活动', ''],
  ['系统', 'キャラクター', '角色', ''],
  ['系统', 'アバター', '虚拟形象', ''],
  ['系统', 'ネームプレート', '名牌', ''],
  ['系统', 'システムボイス', '系统语音', ''],
  ['系统', 'クラス認定', '等级认定', ''],
  ['系统', '全国対戦', '全国对战', ''],
  ['系统', '店内マッチング', '店内匹配', ''],
  ['系统', '課題曲', '课题曲', ''],
  ['系统', '称号', '称号', ''],
  ['系统', 'コラボ', '联动', ''],
  ['系统', 'チュウニペンギン', '中二企鹅', ''],
  ['系统', 'オリジナル楽曲', '原创曲', ''],
  ['系统', '版権曲', '版权曲', ''],
  ['WORLD S END', '属性', '属性', ''],
  ['WORLD S END', "WORLD'S END", "WORLD'S END", ''],
  ['作品/系列', 'ブルーアーカイブ', '蔚蓝档案', ''],
  ['作品/系列', '初音ミク', '初音未来', ''],
  ['作品/系列', '東方Project', '东方Project', ''],
  ['作品/系列', 'ウマ娘', '赛马娘', ''],
  ['作品/系列', 'アイドルマスター', '偶像大师', ''],
  ['作品/系列', 'ラブライブ', 'LoveLive!', ''],
  ['作品/系列', 'プロジェクトセカイ', '世界计划（Project SEKAI）', ''],
  ['作品/系列', 'プリコネ', '公主连结 Re:Dive', ''],
  ['作品/系列', 'アークナイツ', '明日方舟', ''],
  ['作品/系列', 'イロドリミドリ', '彩绿（イロドリミドリ）', ''],
  ['作品/系列', 'ゲキチュウマイ', 'GEKICHUMAI（ゲキチュウマイ）', ''],
  ['系统', 'チュウニズム', '中二节奏（CHUNITHM）', ''],
  ['系统', 'プレイヤー', '玩家', ''],
  ['系统', 'ステージ', '舞台 / 关卡', ''],
  ['系统', 'エリア', '区域', ''],
  ['系统', 'ジャケット', '曲绘封面', ''],
  ['系统', 'セリフ', '台词', ''],
  ['系统', 'ストーリー', '剧情', ''],
  ['系统', 'チャプター', '章节', ''],
  ['系统', 'コンテスト', '比赛 / 征集活动', ''],
  ['系统', 'アーティストコメント', '作者留言', ''],
  ['系统', 'パロディ', '戏仿', ''],
  ['系统', 'スコア', '分数', ''],
  ['系统', 'テーマ', '主题', ''],
  ['系统', 'ホロライブ', 'hololive', ''],
  ['系统', 'アイドル', '偶像', ''],
  ['作品/系列', 'Linked GATE UNIVERSE', 'Linked GATE UNIVERSE（保留原文）', ''],
  ['作品/系列', 'RE:VERSE', 'RE:VERSE（保留原文）', ''],
  ['作品/系列', 'UHUNITHM', 'UHUNITHM（uni 的世界，专有名词，不译）', ''],
  ['作品/系列', 'Rejoice Artcore', 'Rejoice Artcore（保留原文）', ''],
  ['谱师', 'ロシェ＠ペンギン', 'ロシェ＠ペンギン', '人名，不译；别名 EMPEROR'],
  ['谱师', 'ミストルティン', 'ミストルティン', '人名，不译；首席谱师'],
  ['谱师', 'アミノハバキリ', 'アミノハバキリ', '人名，不译；别名 羅破々斬 / Piercing Blade'],
  ['谱师', '譜面-100号', '譜面-100号', '人名，不译']
];

// 谱师名集合
const nameSet = new Set();
for (const v of Object.values(designers)) {
  for (const n of Object.values(v)) if (typeof n === 'string' && n.trim()) nameSet.add(n.trim());
}
for (const d of designerInfo.designers || []) {
  if (d.name) nameSet.add(d.name);
  for (const a of d.aliases || []) if (a) nameSet.add(a);
}
const nameList = [...nameSet].filter((n) => n.length >= 2);

function isDesignerTerm(term) {
  for (const n of nameList) {
    if (n === term) return true;
  }
  return false;
}

const text = Object.values(extra)
  .map((e) => [e.wiki_comment, ...(e.origins || []), ...(e.titles || []).map((r) => r.join(' '))].join('\n'))
  .join('\n');

function count(term) {
  if (!term) return 0;
  let c = 0;
  let i = 0;
  while ((i = text.indexOf(term, i)) !== -1) {
    c++;
    i += term.length;
  }
  return c;
}

const rows = SEED.map(([cat, jp, zh, note]) => ({ category: cat, jp, zh, note, occurrences: count(jp) }));

const known = new Set(SEED.map((r) => r[1]));
const freq = new Map();
for (const m of text.matchAll(/[ァ-ヶー]{3,}/g)) {
  const w = m[0];
  if (known.has(w)) continue;
  freq.set(w, (freq.get(w) || 0) + 1);
}

const auto = [];
const designAuto = [];
for (const [w, c] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  if (c < 5) continue;
  const item = { category: '待确认（自动提取）', jp: w, zh: '', note: '', occurrences: c };
  if (isDesignerTerm(w)) designAuto.push(item);
  else if (auto.length < 120) auto.push(item);
}

fs.writeFileSync(
  path.join(ROOT, '_tmp/chuni-glossary.json'),
  JSON.stringify({ seed: rows, auto, designers: designAuto.slice(0, 120) }, null, 1),
  'utf8'
);
console.log('拟定:', rows.length, '| 待确认:', auto.length, '| 识别为谱师名:', designAuto.length);
console.log('待确认 top:', auto.slice(0, 30).map((x) => x.jp + '(' + x.occurrences + ')').join(' '));
console.log('谱师名样本:', designAuto.slice(0, 15).map((x) => x.jp).join(' / '));
