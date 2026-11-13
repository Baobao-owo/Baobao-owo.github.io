// 给补录的删除曲补上 4 位游戏 id（供预览图命名/详情页用）
// 输出：更新 source/_data/chuni_ids.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)))
    .replace(/[\s\u3000]/g, '')
    .replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');

const IDS_FILE = 'source/_data/chuni_ids.json';
const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8').replace(/^\uFEFF/, ''));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));
const game = JSON.parse(fs.readFileSync('_tmp/game/music.json', 'utf8'));

const byNorm = new Map();
for (const [title, id] of Object.entries(ids)) byNorm.set(norm(title), id);

const gameByNorm = new Map();
for (const g of game) {
  const num = Number(String(g.dir).replace(/\D/g, ''));
  if (!Number.isNaN(num)) gameByNorm.set(norm(g.title), num);
}

let added = 0;
const still = [];
for (const s of removed) {
  if (ids[s.title] !== undefined) continue;
  let id = byNorm.get(norm(s.title));
  if (id === undefined) id = gameByNorm.get(norm(s.title));
  if (id === undefined) {
    still.push(s.title);
    continue;
  }
  ids[s.title] = id;
  byNorm.set(norm(s.title), id);
  added++;
}

fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 1) + '\n', 'utf8');
console.log('补充 id:', added, '仍未匹配:', still.length);
still.slice(0, 10).forEach((t) => console.log('  ' + t));
