// 把 c2s 里的署名补到 chuni.json 里缺署名的黄/绿谱（以及其它缺失难度）
import fs from 'node:fs';

const c2s = JSON.parse(fs.readFileSync('_tmp/build/c2s-creators.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8'));

// title -> musicId
const idOf = new Map();
for (const [title, id] of Object.entries(ids)) {
  if (typeof id === 'number' || /^\d+$/.test(String(id))) idOf.set(String(title).trim(), Number(id));
}
// musicId -> title（多个标题指向同一 ID 时取第一个）
const titleOf = new Map();
for (const [title, id] of idOf) if (!titleOf.has(id)) titleOf.set(id, title);

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const byTitle = new Map(site.songs.map((s) => [norm(s.title), s]));

let filled = 0;
const filledList = [];
const unmatchedIds = [];

for (const [idStr, diffs] of Object.entries(c2s)) {
  const id = Number(idStr);
  const title = titleOf.get(id);
  if (!title) { unmatchedIds.push(id); continue; }
  const song = byTitle.get(norm(title));
  if (!song) { unmatchedIds.push(id); continue; }
  for (const [diff, creator] of Object.entries(diffs)) {
    const name = String(creator || '').trim();
    if (!name || name === '-') continue;
    const sheet = (song.sheets || []).find((s) => s.difficulty === diff);
    if (!sheet) continue;
    const old = String(sheet.designer || '').trim();
    if (old && old !== '-') continue;
    sheet.designer = name;
    filled++;
    filledList.push(`${song.title} ${diff}: ${name}`);
  }
}

fs.writeFileSync('source/_data/chuni.json', JSON.stringify(site), 'utf8');
console.log('补上的谱面:', filled);
filledList.slice(0, 20).forEach((x) => console.log('  ', x));
console.log('未匹配的 musicId:', unmatchedIds.length);
