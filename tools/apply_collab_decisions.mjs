// 按用户填好的清单更新：合作参与者 / 移出合作
import fs from 'node:fs';

const built = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'));
const exact = (t) => {
  const s = built.find((x) => x.t.toLowerCase() === t.toLowerCase() || x.t === t);
  return s ? s.t : t;
};

const COLLAB_ADD = [
  ['Elemental Creation', 'u', ['じゃこレモン', 'Redarrow']],
  ['ラブって♡ジュエリー♪えんじぇる☆ブレイク!!', 'm', ['Emerald', '小鳥遊 さん', 'ぴちネコ']],
  ['Athlete Killer "Meteor"', 'm', ['サファ太', 'Redarrow']],
  ['超MANJIラッシュ', 'm', ['じゃこレモン', 'Luxizhel']],
  ['ALTER EGO', 'm', ['ミニミライト', 'ぴちネコ']],
  ['[IMPERIALDISORDER]', 'm', ['イノシカ提灯', 'じゃこレモン']],
  ['GranFatalité', 'm', ['すきやき奉行', '緑化委員長']],
  ['PRAGMATISM -RESURRECTION-', 'm', ['ミストルティン', 'Redarrow']],
  ['We Gonna Party -Feline Groove Mix-', 'm', ['ぴちネコ', 'Jack']],
  ['うまぴょい伝説', 'm', ['小鳥遊 さん', 'Redarrow', 'ミストルティン']],
  ['ゴー・トゥ・大都会', 'm', ['ミニミライト']],
];

const SINGLE = [
  'チュルリラ・チュルリラ・ダッダッダ!',
  'トランスダンスアナーキー',
  'Everlasting Today',
  'Black Swan Lake',
  'Lemegeton -little key of solomon-',
  'Last Celebration',
];

const MANUAL = 'tools/designer-manual.json';
const manual = JSON.parse(fs.readFileSync(MANUAL, 'utf8'));
manual.collab = manual.collab || {};
for (const [title, diff, people] of COLLAB_ADD) {
  const t = exact(title);
  const key = Object.keys(manual.collab).find((k) => k.toLowerCase() === t.toLowerCase()) || t.toLowerCase();
  manual.collab[key] = manual.collab[key] || {};
  manual.collab[key][diff] = people;
}
fs.writeFileSync(MANUAL, JSON.stringify(manual, null, 2) + '\n', 'utf8');
console.log('手填合作:', Object.keys(manual.collab).length, '首');

const EX = 'tools/collab-exclude.json';
const ex = JSON.parse(fs.readFileSync(EX, 'utf8'));
for (const t of SINGLE) {
  const name = exact(t);
  if (!ex.includes(name)) ex.push(name);
}
fs.writeFileSync(EX, JSON.stringify(ex, null, 1) + '\n', 'utf8');
console.log('排除清单:', ex.length, '首');
ex.forEach((t) => console.log('  - ' + t));
