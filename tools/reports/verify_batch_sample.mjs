// 复核首批 10 首：对照曲库 category/artist 与剧情站
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const file = path.join(ROOT, '_tmp/batch1-sample10.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));

const facts = {};
for (const s of guide.songs) {
  facts[s.title] = { category: s.category, artist: s.artist, version: s.version };
}

const SONG_CHECK = {
  'RE Aoharu': {
    note: '曲库：POPS & ANIME / Nor「ブルーアーカイブ」；作品名用官方《蔚蓝档案》',
    edits: []
  },
  'アンクローズ・ヒューマン': {
    note: '曲库：niconico；artist 字段含作词/编曲/调声，译文补全',
    edits: [
      {
        match: '使用声库：初音未来',
        zh: '使用声库：初音未来；作词：傘村トータ，编曲：ねじ式，调声：シリア'
      }
    ]
  },
  Melodiniq: {
    note: '曲库：ORIGINAL / onoken a.k.a. owl＊tree / X-VERSE-X；剧情对应 Linked GATE UNIVERSE，登场的是未来的尤尼·伊克西亚',
    edits: [
      {
        match: '称号「C U again!!」：把「See you again」的前两个词分别换成 CHUNITHM 的 C 和 UHUNITHM 的 U。',
        zh: '称号「C U again!!」：把「See you again」的前两个词分别换成 CHUNITHM 的 C 和 UHUNITHM 的 U——UHUNITHM 是尤尼所在次元的系统，也呼应尤尼的告别。'
      }
    ]
  },
  千本桜: {
    note: '曲库：niconico / 黒うさP / 初代版本收录；ULTIMA 于 2023/2/9 追加',
    edits: [
      { match: '使用声库：初音未来', zh: '使用声库：初音未来；曲师：黒うさP' }
    ]
  },
  'Bad Apple!! feat.nomico': {
    note: '曲库：東方Project / Masayoshi Minoshima；曲绘说明来自 wiki',
    edits: [
      { match: '作词：Haruka', zh: '作词：Haruka；曲师：Masayoshi Minoshima' }
    ]
  },
  'ナイト・オブ・ナイツ': {
    note: '曲库：東方Project / ビートまりお；英文四写法为作曲者原话',
    edits: [
      { match: '收录于专辑《花詠束》的曲目。', zh: '收录于专辑《花詠束》的曲目；曲师：ビートまりお。' }
    ]
  },
  'FREEDOM DiVE': {
    note: '曲库：VARIETY / xi；ND 名义梗与谱师（ぴちネコ 等）对应',
    edits: [
      { match: '2008 年 BMS 活动「MAXBEAT」的参展曲，曲风为 HAPPY HARDCORE。', zh: '2008 年 BMS 活动「MAXBEAT」的参展曲，曲风为 HAPPY HARDCORE；曲师：xi。' }
    ]
  },
  'チルノのパーフェクトさんすう教室': {
    note: '曲库：東方Project / ARM＋夕野ヨシミ (IOSYS) feat.miko',
    edits: [
      { match: 'IOSYS 专辑《東方氷雪歌集》收录曲。', zh: 'IOSYS 专辑《東方氷雪歌集》收录曲；曲师：ARM＋夕野ヨシミ (IOSYS) feat.miko。' }
    ]
  },
  '回レ！雪月花': {
    note: '曲库：POPS & ANIME / 歌組雪月花；机巧少女 ED（此前误归彩绿，已更正）',
    edits: [
      { match: '动画《机巧少女不会受伤》ED 曲。', zh: '动画《机巧少女不会受伤》ED 曲；歌手：歌組雪月花 夜々(原田 ひとみ)/いろり(茅野 愛衣)/小紫(小倉 唯)。' }
    ]
  },
  'Oshama Scramble!': {
    note: '曲库：ゲキマイ / t+pazolite；Joypolis 设施说明来自 wiki',
    edits: [
      { match: '原为 SEGA 主题乐园「Joypolis」的游乐设施「Halfpipe Tokyo」所用曲目，后移植到「maimai ORANGE PLUS」。', zh: '原为 SEGA 主题乐园「Joypolis」的游乐设施「Halfpipe Tokyo」所用曲目，后移植到「maimai ORANGE PLUS」；曲师：t+pazolite。' }
    ]
  }
};

for (const song of data) {
  const chk = SONG_CHECK[song.song] || { note: '曲库未收录？', edits: [] };
  const f = facts[song.song];
  const factLine = f ? `曲库：${f.category} / ${f.artist} / ${f.version}` : '曲库无此曲';
  for (const item of song.items) {
    for (const e of chk.edits) {
      if (item.zh === e.match) item.zh = e.zh;
    }
    item.check = '✅ ' + factLine;
  }
  song.factNote = chk.note;
}

fs.writeFileSync(path.join(ROOT, '_tmp/batch1-sample10-verified.json'), JSON.stringify(data, null, 1), 'utf8');
console.log('复核完成：', data.length, '首');
for (const s of data) console.log('-', s.song, '|', s.factNote.slice(0, 60));
