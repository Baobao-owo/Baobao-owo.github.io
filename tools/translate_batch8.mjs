import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('_tmp/batch8-raw.json', 'utf8'));
const out = [];

const special = {
  'Funny Funky Freaky': [{ type: '介绍', jp: 'BMSイベント「G2R2014」出展楽曲。ジャンルはFUNK。', zh: 'BMS 活动「G2R2014」参展曲，曲风是 FUNK。', note: '' }],
  '愛き夜道 feat. ランコ、雨天決行': [
    { type: '介绍', jp: 'アルバム「Chill★Now」収録曲。', zh: '收录于专辑《Chill★Now》。', note: '' },
    { type: '介绍', jp: '歌唱: 雨天決行、ランコ', zh: '演唱：雨天決行、ランコ', note: '' }
  ],
  'ゴーゴー幽霊船': [
    { type: '介绍', jp: '米津玄師名義としての1stアルバム『 diorama 』収録楽曲。', zh: '米津玄师名义下的第 1 张专辑《diorama》收录曲。', note: '' }
  ]
};

for (const [song, data] of Object.entries(raw)) {
  if (special[song]) {
    out.push({ song, items: special[song] });
    continue;
  }
  const items = [];
  for (const line of String(data.intro).split('\n')) {
    if (!line.trim()) continue;
    let zh = line;
    const m = line.match(/^(\d{4}\/\d{1,2}\/\d{1,2})追加、(.+?)マップ([0-9０-９]+)元課題曲。$/);
    if (m) {
      const num = m[3].replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));
      zh = `${m[1]} 追加，${m[2]} 地图 ${num} 的原课题曲。`;
    } else {
      const m2 = line.match(/^(\d{4}\/\d{1,2}\/\d{1,2}) (.*)$/);
      if (m2) {
        zh = `${m2[1]} ${m2[2]}`;
      }
    }
    items.push({ type: '介绍', jp: line, zh, note: '' });
  }
  out.push({ song, items });
  // 校验：必须有译文
  for (const it of items) if (!it.zh) console.log('MISS', song, it.jp);
}

fs.writeFileSync('_tmp/batch8-translated.json', JSON.stringify(out, null, 1), 'utf8');
console.log('songs', out.length, 'items', out.reduce((a, s) => a + s.items.length, 0));
