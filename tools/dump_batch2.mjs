import fs from 'node:fs';

const e = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));
const picks = [
  'Altale',
  'QZKago Requiem',
  'シャルル',
  'ベノム',
  'Starduster',
  'Armageddon',
  'KING',
  'STAR',
  '神鳴',
  "Tru'nembra",
  'OUTRAGE',
  '轆轤首',
  '月葬',
  'Linked Tune',
  'YOUNITHM',
  '創 -汝ら新世界へ歩む者なり-',
  '輪廻玲々',
  'Phantom Crisis',
  'Everything Will Be One',
  'Sweet & Sour'
];
const out = {};
for (const t of picks) {
  const x = e[t];
  if (!x) {
    out[t] = { missing: true };
    continue;
  }
  out[t] = { intro: String(x.wiki_comment || ''), origins: x.origins || [], titles: (x.titles || []).slice(1) };
}
fs.writeFileSync('_tmp/batch2-raw.json', JSON.stringify(out, null, 1), 'utf8');
console.log('songs', Object.keys(out).length, 'size', fs.statSync('_tmp/batch2-raw.json').size);
