import fs from 'node:fs';

const built = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'));
const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8')).songs;
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const expectSingle = [
  'チュルリラ・チュルリラ・ダッダッダ!',
  'トランスダンスアナーキー',
  'Everlasting Today',
  'Black Swan Lake',
  'Lemegeton -little key of solomon-',
  'Last Celebration',
];
const expectCollab = [
  'Elemental Creation',
  'ラブって♡ジュエリー♪えんじぇる☆ブレイク!!',
  'Athlete Killer "Meteor"',
  '超MANJIラッシュ',
  'ALTER EGO',
  '[IMPERIALDISORDER]',
  'GranFatalité',
  'PRAGMATISM -RESURRECTION-',
  'We Gonna Party -Feline Groove Mix-',
  'うまぴょい伝説',
  'ゴー・トゥ・大都会',
];

const get = (t) => built.find((s) => norm(s.t) === norm(t));

console.log('== 应为单人 ==');
for (const t of expectSingle) {
  const s = get(t);
  const cl = s ? s.cl : '?';
  const mark = cl === 0 ? 'OK ' : '!! ';
  console.log(mark + t + ' cl=' + cl);
}
console.log('');
console.log('== 应为合作 ==');
for (const t of expectCollab) {
  const s = get(t);
  const cl = s ? s.cl : '?';
  const keys = Object.keys(collab).filter((k) => norm(k) === norm(t));
  const entry = keys.length ? collab[keys[0]] : null;
  const mark = cl === 1 ? 'OK ' : '!! ';
  console.log(mark + t + ' cl=' + cl + ' | ' + (entry ? JSON.stringify(entry) : '(无参与者)'));
}
