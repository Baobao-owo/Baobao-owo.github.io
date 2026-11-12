// 逐行翻译导出（术语表更全，垃圾行清理）
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

// 先替换成中文，机翻会原样保留
const GLOSSARY = [
  ['元次課題曲', '原次课题曲'],
  ['元課題曲', '原课题曲'],
  ['課題曲', '课题曲'],
  ['課題', '课题'],
  ['対応キャラ', '对应角色'],
  ['キャラクター', '角色'],
  ['エリア', '区域'],
  ['譜面', '谱面'],
  ['解禁', '解锁'],
  ['通常配信', '通常配信'],
  ['配信停止', '停止配信'],
  ['称号', '称号'],
  ['楽曲', '乐曲'],
  ['収録', '收录'],
  ['難易度', '难度'],
  ['判定', '判定'],
  ['ノーツ', '音符'],
  ['スキル', '技能'],
  ['イベント', '活动'],
  ['マップ', '地图'],
  ['アートワーク', '曲绘'],
  ['ジャケット', '曲绘'],
  ['ジャンル', '分类'],
  ['アプデ', '更新'],
  ['アップデート', '更新'],
  ['実装', '实装'],
  ['稼働', '稼动'],
  ['プレイ', '游玩'],
  ['スコア', '分数'],
  ['フルコンボ', '全连'],
  ['クリア', '通关'],
  ['ランキング', '排行榜'],
  ['チケット', '票券'],
  ['ガチャ', '扭蛋'],
  ['ペンギン', '企鹅'],
  ['達成', '达成'],
  ['挑戦', '挑战'],
  ['開催', '举办'],
  ['期間', '期间'],
  ['限定', '限定'],
  ['連動', '联动'],
  ['先行', '先行'],
  ['取得', '获得'],
  ['条件', '条件']
];

// wiki 页脚/工具残留、以及不需要翻译的「情報」行
const JUNK = [/fontawesome/i, /^情報/, /^-->\s*$/, /^※$/];

function cleanLines(ja) {
  const lines = String(ja)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !JUNK.some((re) => re.test(l)));
  return lines.map((line) => {
    let out = line;
    for (const [jp, cn] of GLOSSARY) out = out.split(jp).join(cn);
    return out;
  });
}

const pending = [];
for (const [k, e] of Object.entries(extra)) {
  const ja = e.wiki_comment || '';
  if (!ja) continue;
  const lines = cleanLines(ja);
  if (!lines.length) continue;
  pending.push({ k, t: lines.join('\n').slice(0, 4500) });
}

fs.writeFileSync(ROOT + '/_tmp/zh-lines-pending.json', JSON.stringify(pending), 'utf8');
const h = Math.ceil(pending.length / 2);
fs.writeFileSync(ROOT + '/_tmp/zh-lines-a.json', JSON.stringify(pending.slice(0, h)), 'utf8');
fs.writeFileSync(ROOT + '/_tmp/zh-lines-b.json', JSON.stringify(pending.slice(h)), 'utf8');
console.log('待逐行重译:', pending.length, '| 分成两份', h, pending.length - h);
