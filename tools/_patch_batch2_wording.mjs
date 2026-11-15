import fs from 'node:fs';

const p = '_tmp/batch2-translated.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));

let changed = 0;
for (const song of data) {
  for (const item of song.items) {
    const before = item.zh;
    let zh = item.zh;
    // 承接……的谱系 → 是……的续作
    zh = zh.replace(/承接([^。]*?)的谱系/g, '是$1的续作');
    zh = zh.replace(/也可能承接([^。]*?)的续作/g, '也可能是$1的续作');
    // 剩余「谱系」统一改成「续作」
    zh = zh.replace(/的谱系/g, '的续作');
    // 曲风为 → 曲风是
    zh = zh.replace(/曲风为/g, '曲风是');
    // 曲风 X → 曲风是 X（X 为英文/片假名且前面没有「是」）
    zh = zh.replace(/曲风\s+(?![是为])/g, '曲风是 ');
    if (zh !== before) {
      item.zh = zh;
      changed++;
    }
  }
}
fs.writeFileSync(p, JSON.stringify(data, null, 1), 'utf8');
console.log('修改条目:', changed);
for (const s of data) for (const i of s.items) if (i.zh.includes('续作') || i.zh.includes('曲风是')) console.log('·', s.song, '|', i.zh.slice(0, 80));
