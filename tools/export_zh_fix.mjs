// 只重译「术语没生效」的条目
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

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
  ['実装', '实装'],
  ['稼働', '稼动'],
  ['プレイ', '游玩'],
  ['スコア', '分数'],
  ['フルコンボ', '全连'],
  ['クリア', '通关'],
  ['ランキング', '排行榜'],
  ['チケット', '票券'],
  ['ガチャ', '扭蛋'],
  ['ペンギン', '企鹅']
];

const JUNK = [/fontawesome/i, /^情報/, /^-->\s*$/, /^※$/];

function clean(ja) {
  return String(ja)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !JUNK.some((re) => re.test(l)))
    .map((line) => {
      let out = line;
      for (const [jp, cn] of GLOSSARY) out = out.split(jp).join(cn);
      return out;
    });
}

const BAD_ZH = /主打歌|作业歌|源氏|原创主题曲|原创作业曲/;
const pending = [];
for (const [k, e] of Object.entries(extra)) {
  const ja = e.wiki_comment || '';
  const zh = e.wiki_comment_zh || '';
  if (!ja) continue;
  const bad = (ja.includes('課題曲') && !zh.includes('课题曲')) || BAD_ZH.test(zh);
  if (!bad) continue;
  const lines = clean(ja);
  pending.push({ k, t: lines.join('\n').slice(0, 4500) });
}

fs.writeFileSync(ROOT + '/_tmp/zh-fix.json', JSON.stringify(pending), 'utf8');
console.log('需要修术语的条目:', pending.length);
