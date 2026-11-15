import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const built = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'));
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const collab = JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8')).songs;
const docx = JSON.parse(fs.readFileSync('source/_data/collab_docx_titles.json', 'utf8'));
const wiki = JSON.parse(fs.readFileSync('_tmp/wiki/designer-map-all.json', 'utf8'));

// wiki 合作小节里列过的曲目
const wikiCollab = new Map();
for (const sec of wiki) {
  if (!/合作/.test(sec.heading || '')) continue;
  for (const r of sec.rows || []) {
    const k = norm(r.title);
    if (!wikiCollab.has(k)) wikiCollab.set(k, []);
    wikiCollab.get(k).push(r.diff + ':' + String(r.credit || '').replace(/\*\d+$/, ''));
  }
}

const persons = new Set((designers.designers || []).map((d) => d.name));
const letters = ['b', 'a', 'e', 'm', 'u'];
const DIFFJA = { b: 'BASIC', a: 'ADVANCED', e: 'EXPERT', m: 'MASTER', u: 'ULTIMA' };

const rows = [];
for (const title of docx) {
  const song = built.find((s) => norm(s.t) === norm(title));
  if (!song) continue;
  if (song.cl !== 1) continue; // 只挑还带着合作标记的
  const dk = Object.keys(designers.songs).find((k) => norm(k) === norm(title));
  const d = dk ? designers.songs[dk] : {};
  const per = letters
    .filter((k) => d[k])
    .map((k) => {
      const who = d[k].who || '';
      const raw = d[k].raw || '';
      return { diff: DIFFJA[k], who, raw, known: persons.has(who) };
    });
  const allKnown = per.length && per.every((x) => x.known);
  const wikiRows = wikiCollab.get(norm(title)) || [];
  if (!allKnown) continue; // 只列「每个难度都能归到具体谱师」的
  rows.push({
    title: song.t,
    per: per.map((x) => x.diff + '：' + (x.who === x.raw ? x.who : x.raw + '（' + x.who + '）')).join('\n'),
    wiki: wikiRows.length ? wikiRows.join('、') : '',
    collabData: collab[dk] ? JSON.stringify(collab[dk]) : '',
    big: song.big,
  });
}

rows.sort((a, b) => (b.wiki ? 1 : 0) - (a.wiki ? 1 : 0) || a.title.localeCompare(b.title, 'ja'));
fs.writeFileSync('_tmp/questionable_collab.json', JSON.stringify(rows, null, 1), 'utf8');
console.log('待确认曲目:', rows.length);
rows.forEach((r, i) => console.log(i + 1, r.title, '| wiki合作节:', r.wiki ? '有' : '无'));
