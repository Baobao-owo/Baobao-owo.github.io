// 给 ]-[|/34<#! 补 wiki 介绍（中日）+ 标记为删除曲
import fs from 'node:fs';

const TITLE = ']-[|/34<#!';

const JP = [
  '2008年にケイブからAC及びXbox 360用に発売された弾幕シューティング「怒首領蜂大復活」からの収録。曲名はLeet表記で「HIBACHI」と書かれている。',
  '同シリーズの別作品「怒首領蜂 大往生」からのBGM『緋蜂』が同音・同作曲者のため混同しやすい点に注意。',
  'LUMINOUS PLUS稼働に伴い配信停止となったが、現レベル14+の譜面が削除される事例はこれが初となる(紅と同様。)。',
  'また、MASが旧13+(現定数14.7以上)、EXPが11+以上に相当する難易度の譜面が削除される事例は今回が初となる。',
].join('\n');

const ZH = [
  '收录自 2008 年 CAVE 面向街机与 Xbox 360 发售的弹幕射击游戏《怒首領蜂大復活》。曲名以 Leet 表记写作「HIBACHI」。',
  '注意：同系列另一作《怒首領蜂 大往生》的 BGM《緋蜂》同音，作曲者也相同，容易混淆。',
  '随 LUMINOUS PLUS 稼动停止配信；现行等级 14+ 的谱面被删除，这是首次（与「紅」相同）。',
  '另外，MASTER 相当于旧 13+（现定数 14.7 以上）、EXPERT 相当于 11+ 以上的谱面被删除，这也是首次。',
].join('\n');

// 1) chuni_extra.json
const EXTRA = 'source/_data/chuni_extra.json';
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));
const cur = extra[TITLE] || {};
cur.wiki_comment = JP;
cur.wiki_comment_zh = ZH;
extra[TITLE] = cur;
fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1) + '\n', 'utf8');
console.log('extra 写入:', TITLE, '| 简介长度', JP.length);

// 2) chuni_removed.json：把这首歌加进 matched（生成器据此打删除标记）
const REMOVED = 'source/_data/chuni_removed.json';
const rm = JSON.parse(fs.readFileSync(REMOVED, 'utf8').replace(/^\uFEFF/, ''));
rm.matched = rm.matched || [];
if (!rm.matched.some((x) => String(x.id) === TITLE)) {
  rm.matched.push({ id: TITLE, title: TITLE });
  fs.writeFileSync(REMOVED, JSON.stringify(rm, null, 1) + '\n', 'utf8');
  console.log('removed 追加:', TITLE);
} else {
  console.log('removed 已存在');
}
