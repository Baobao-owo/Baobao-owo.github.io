// 生成「谱师显示名」对照表：把游戏/数据里的别名写法统一显示成正式名
import fs from 'node:fs';

const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const extra = JSON.parse(fs.readFileSync('tools/designer-alias-extra.json', 'utf8').replace(/^\uFEFF/, ''));

const out = {};
for (const [alias, who] of Object.entries(extra)) out[alias] = who;

const songs = designers.songs || {};
for (const key of Object.keys(songs)) {
  const rec = songs[key];
  for (const d of ['b', 'a', 'e', 'm', 'u']) {
    const x = rec[d];
    if (!x || !x.raw || !x.who) continue;
    if (x.who === '制作者不明' || x.who === '团队名义') continue;
    if (x.raw !== x.who) out[x.raw] = x.who;
  }
}

fs.writeFileSync('source/_data/chuni_designer_alias.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('别名对照:', Object.keys(out).length, '条');
console.log('样本:', Object.entries(out).slice(0, 5).map(([a, b]) => a + ' → ' + b).join(' | '));
