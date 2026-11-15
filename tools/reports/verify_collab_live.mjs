import fs from 'node:fs';

const res = await fetch('https://baobao-owo.github.io/chuni-songs.json?v=' + Date.now());
const live = await res.json();
const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const get = (t) => live.find((s) => norm(s.t) === norm(t));

const singles = ['チュルリラ・チュルリラ・ダッダッダ!', 'トランスダンスアナーキー', 'Everlasting Today', 'Black Swan Lake', 'Lemegeton -little key of solomon-', 'Last Celebration'];
const collabs = ['Elemental Creation', 'ラブって♡ジュエリー♪えんじぇる☆ブレイク!!', 'Athlete Killer "Meteor"', '超MANJIラッシュ', 'ALTER EGO', '[IMPERIALDISORDER]', 'GranFatalité', 'PRAGMATISM -RESURRECTION-', 'We Gonna Party -Feline Groove Mix-', 'うまぴょい伝説', 'ゴー・トゥ・大都会'];

let bad = 0;
for (const t of singles) {
  const s = get(t);
  const ok = s && s.cl === 0;
  if (!ok) bad++;
  console.log((ok ? 'OK ' : '!! ') + '单人 ' + t + ' cl=' + (s ? s.cl : '?'));
}
for (const t of collabs) {
  const s = get(t);
  const ok = s && s.cl === 1;
  if (!ok) bad++;
  console.log((ok ? 'OK ' : '!! ') + '合作 ' + t + ' cl=' + (s ? s.cl : '?'));
}
console.log('异常:', bad);
