// 把 wiki 分工表并进 collab-parts.json，并把参与者写进 collab.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8')).songs
  .concat(JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8')));
const siteTitles = site.map((s) => s.title);
const byNorm = new Map(siteTitles.map((t) => [norm(t), t]));

function resolveTitle(rawTitle) {
  const exact = byNorm.get(norm(rawTitle));
  if (exact) return exact;
  const nt = norm(rawTitle);
  const cand = siteTitles.find((t) => norm(t).startsWith(nt) || nt.startsWith(norm(t)));
  return cand || rawTitle;
}

const found = JSON.parse(fs.readFileSync('_tmp/build/parts-all.json', 'utf8'));
const partsPath = 'source/assets/data/collab-parts.json';
const parts = JSON.parse(fs.readFileSync(partsPath, 'utf8'));
const collabPath = 'source/assets/data/collab.json';
const collab = JSON.parse(fs.readFileSync(collabPath, 'utf8'));

let addedParts = 0;
let addedCollab = 0;
const addedTitles = [];

for (const rec of Object.values(found)) {
  const title = resolveTitle(rec.title);
  const key = norm(title);

  if (!parts[key] || (parts[key].rows || []).length < rec.rows.length) {
    if (!parts[key]) addedParts++;
    parts[key] = { title, headers: rec.headers, rows: rec.rows };
  }

  // 参与者：取第二列，拆开双人写法
  const people = [];
  for (const r of rec.rows) {
    const who = String(r[1] || '').trim();
    if (!who) continue;
    for (const p of who.split(/\s*(?:&|＆|vs\.?|×|＋|\+)\s*/i)) {
      const name = p.trim();
      if (name && !people.includes(name)) people.push(name);
    }
  }
  if (people.length < 2) continue;

  // 难度：已有合作数据里能对上的难度优先，否则 master
  let diff = rec.diff === 'we' ? 'u' : 'master';
  const existing = collab.songs[key];
  if (existing) {
    const hit = ['e', 'm', 'u', 'a', 'b'].find((d) => (existing[d] || []).length > 1);
    if (hit) diff = hit;
  }
  if (!collab.songs[key]) { collab.songs[key] = {}; addedCollab++; addedTitles.push(title); }
  const cur = collab.songs[key][diff] || [];
  collab.songs[key][diff] = [...new Set(cur.concat(people))];
}

collab.stats = Object.assign({}, collab.stats || {}, {
  songs: Object.keys(collab.songs).length,
  charts: Object.values(collab.songs).reduce((a, r) => a + Object.keys(r).length, 0),
});

fs.writeFileSync(partsPath, JSON.stringify(parts, null, 1) + '\n', 'utf8');
fs.writeFileSync(collabPath, JSON.stringify(collab, null, 1) + '\n', 'utf8');
fs.copyFileSync(partsPath, 'source/_data/collab_parts.json');

console.log('分工表:', Object.keys(parts).length, '| 新增:', addedParts);
console.log('合作数据:', Object.keys(collab.songs).length, '| 新增曲目:', addedCollab);
addedTitles.slice(0, 20).forEach((t) => console.log('  +', t));
