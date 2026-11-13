// 重建谱师索引：以 .c2s 的 CREATOR 为主，朋友那份 wiki 数据作补充
// 输出：source/assets/data/designers.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const FRIEND = 'D:/QQ/Downloads/songs.min.json';
const C2S = '_tmp/game/c2s-designers-all.json';
const IDS = 'source/_data/chuni_ids.json';
const SITE = 'source/_data/chuni.json';
const REMOVED = 'source/_data/chuni_removed_songs.json';
const OUT = 'source/assets/data/designers.json';

const friend = JSON.parse(fs.readFileSync(FRIEND, 'utf8'));
const c2s = JSON.parse(fs.readFileSync(C2S, 'utf8'));
const ids = JSON.parse(fs.readFileSync(IDS, 'utf8').replace(/^\uFEFF/, ''));
const site = JSON.parse(fs.readFileSync(SITE, 'utf8'));
const removed = JSON.parse(fs.readFileSync(REMOVED, 'utf8'));

// 别名 → 人
const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}

// 朋友的逐谱 charter（按曲名 + 难度）
const DIFF_KEY = { EXPERT: 'e', MASTER: 'm', ULTIMA: 'u' };
const friendCharts = new Map();
for (const s of friend.songs || []) {
  const entry = {};
  for (const c of s.charts || []) {
    const k = DIFF_KEY[String(c.difficulty || '').toUpperCase()];
    if (k) entry[k] = String(c.charter || '').trim();
  }
  friendCharts.set(norm(s.title), entry);
}

const IDX = { e: 2, m: 3, u: 4, a: 1, b: 0 };

const songsOut = {};
const whoSongs = new Map();
const whoCharts = new Map();
const looseSongs = new Map();

function addTo(map, key, val) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(val);
}

const allSongs = site.songs.concat(removed);
for (const s of allSongs) {
  const title = String(s.title || '').trim();
  if (!title) continue;
  const key = norm(title);
  const id = ids[title];
  const fd = friendCharts.get(key) || {};
  const entry = {};

  for (const diff of ['b', 'a', 'e', 'm', 'u']) {
    // 站内只有 B/A/E/M/U 五种；没有这张谱就跳过
    const has = (s.sheets || []).some((sh) => {
      const map = { basic: 'b', advanced: 'a', expert: 'e', master: 'm', ultima: 'u' };
      return map[sh.difficulty] === diff;
    });
    if (!has) continue;

    let raw = '';
    if (id !== undefined) {
      const v = c2s[String(Number(id)) + '_' + IDX[diff]];
      if (v) raw = v;
    }
    if (!raw) raw = fd[diff] || '';
    if (!raw) continue;

    const who = alias2who.get(norm(raw)) || '';
    entry[diff] = { who, raw };
    // 面板只按 E/M/U 统计（和筛选器的难度按钮一致），B/A 只存数据不计数
    const counted = diff === 'e' || diff === 'm' || diff === 'u';
    if (!counted) continue;
    if (who) {
      addTo(whoSongs, who, key);
      whoCharts.set(who, (whoCharts.get(who) || 0) + 1);
    } else {
      addTo(looseSongs, raw, key);
    }
  }
  if (Object.keys(entry).length) songsOut[key] = entry;
}

// 谱师名单：朋友那 49 人（按曲数排），只保留真正有曲子的
const designers = (friend.designers || [])
  .map((d) => ({
    name: d.name,
    id: d.id || '',
    charts: whoCharts.get(d.name) || 0,
    songs: (whoSongs.get(d.name) || new Set()).size,
    aliases: (d.aliases || []).length,
  }))
  .filter((d) => d.songs > 0)
  .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));

const loose = [...looseSongs.entries()]
  .map(([name, set]) => ({ name, songs: set.size }))
  .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));

// c2s 里出现、但别名表里没有的名义，也进 loose（避免遗漏）
const seenLoose = new Set(loose.map((x) => norm(x.name)));
for (const [k, who] of Object.entries(c2s)) {
  if (!who) continue;
  if (alias2who.has(norm(who))) continue;
  if (seenLoose.has(norm(who))) continue;
  seenLoose.add(norm(who));
  loose.push({ name: who, songs: 0, c2sOnly: true });
}

const payload = {
  stats: {
    designers: designers.length,
    songs: Object.keys(songsOut).length,
    looseNames: loose.length,
    source: 'c2s + wiki(friend)',
  },
  designers,
  loose,
  songs: songsOut,
};

fs.mkdirSync('source/assets/data', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log('谱师', designers.length, '| 曲目', Object.keys(songsOut).length, '| loose', loose.length, '|', kb, 'KB');
console.log('前 8:', designers.slice(0, 8).map((d) => d.name + '(' + d.songs + ')').join(' / '));
