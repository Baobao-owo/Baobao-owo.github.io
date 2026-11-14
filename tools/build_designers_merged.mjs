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
// 用户确认的额外写法（游戏 CREATOR 里出现的别名）
const EXTRA_ALIAS = JSON.parse(fs.readFileSync('tools/designer-alias-extra.json', 'utf8').replace(/^﻿/, ''));
for (const [alias, who] of Object.entries(EXTRA_ALIAS)) alias2who.set(norm(alias), who);

// wiki「譜面製作者一覧」里逐曲标注的クレジット名，补进别名表
// （只补朋友数据里没有的，避免覆盖）
const WIKI_ALIASES = 'tools/designer-wiki-aliases.json';
if (fs.existsSync(WIKI_ALIASES)) {
  const extra = JSON.parse(fs.readFileSync(WIKI_ALIASES, 'utf8'));
  for (const [credit, person] of Object.entries(extra)) {
    const k = norm(credit);
    if (!alias2who.has(k)) alias2who.set(k, person);
  }
}

// 用户手工填的对照（tools/designer-manual.json）优先级最高
const MANUAL_FILE = 'tools/designer-manual.json';
const manual = fs.existsSync(MANUAL_FILE)
  ? JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8'))
  : { aliases: {}, newDesigners: [], collab: {} };
for (const [bad, good] of Object.entries(manual.aliases || {})) {
  alias2who.set(norm(bad), good);
}
const manualDesigners = manual.newDesigners || [];
for (const d of manualDesigners) {
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
  alias2who.set(norm(d.name), d.name);
}
// 名义前面挂的「【Ex】」是活动/复刻标记，不是另一个人：
// 先原样查，查不到就去掉前缀再查一次。
const EX_PREFIX = /^\s*(?:【\s*ex\s*】|\[\s*ex\s*\]|（\s*ex\s*）|\(\s*ex\s*\))\s*/i;
function stripExPrefix(raw) {
  const s = String(raw || '');
  const out = s.replace(EX_PREFIX, '').trim();
  return out === s.trim() ? '' : out;
}

// 去空格、去首尾符号、去星号脚注、统一引号
const squash = (s) => String(s || '').replace(/[\s\u3000]+/g, '').toLowerCase();
function stripDecoration(raw) {
  return String(raw || '')
    .replace(/\s*[*＊]\s*\d*\s*$/g, '')
    .replace(/^[\s\-–—－_~〜・:：]+/, '')
    .replace(/[\s\-–—－_~〜・:：]+$/, '')
    .replace(/[「」『』“”"]/g, '')
    .trim();
}

// 去空格后的别名索引，用来吃「如月ゆかり」vs「如月 ゆかり」这种写法差异
const aliasSquashed = new Map();
for (const [k, who] of alias2who) aliasSquashed.set(squash(k), who);

function lookupWho(raw) {
  if (!raw) return '';
  const variants = [];
  const s = String(raw).trim();
  variants.push(s, stripDecoration(s), stripExPrefix(s), stripDecoration(stripExPrefix(s)));
  for (const v of variants) {
    if (!v) continue;
    const hit = alias2who.get(norm(v)) || aliasSquashed.get(squash(v));
    if (hit) return hit;
  }
  return '';
}

// 手工确认过的错字/写法差异（只收明显是笔误的，见 tools/designer-typos.json）
const typoMap = new Map();
const typoFile = 'tools/designer-typos.json';
if (fs.existsSync(typoFile)) {
  for (const [bad, good] of Object.entries(JSON.parse(fs.readFileSync(typoFile, 'utf8')))) {
    typoMap.set(norm(bad), good);
  }
}

function resolveWho(raw) {
  if (!raw) return '';
  const fixed = typoMap.get(norm(raw));
  if (fixed) {
    const hit = alias2who.get(norm(fixed)) || aliasSquashed.get(squash(fixed));
    if (hit) return hit;
  }
  return lookupWho(raw);
}

// 团队 / 合作团体名义：不是某个人，统一收进「团队名义」
const TEAM_WHO = '团队名义';
const teamNames = new Set();
const teamFile = 'tools/designer-teams.json';
if (fs.existsSync(teamFile)) {
  for (const name of JSON.parse(fs.readFileSync(teamFile, 'utf8'))) teamNames.add(norm(name));
}
function teamOf(raw) {
  if (!raw) return '';
  if (teamNames.has(norm(raw))) return TEAM_WHO;
  const stripped = stripExPrefix(raw);
  if (stripped && teamNames.has(norm(stripped))) return TEAM_WHO;
  return '';
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


// 部分新曲以曲目页的「譜面作者」为准（tools/designer-song-credits.json）
function songCreditWho(titleKey, diff) {
  if (!songCreditWho._data) {
    try {
      songCreditWho._data = JSON.parse(fs.readFileSync('tools/designer-song-credits.json', 'utf8'));
    } catch (e) {
      songCreditWho._data = {};
    }
    songCreditWho._keys = new Map();
    for (const t of Object.keys(songCreditWho._data)) songCreditWho._keys.set(norm(t), t);
  }
  const t = songCreditWho._keys.get(titleKey);
  if (!t) return '';
  const cell = songCreditWho._data[t] && songCreditWho._data[t][diff];
  return cell && cell.who ? cell.who : '';
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
    const fixedWho = songCreditWho(key, diff);
    if (!raw && !fixedWho) continue;
    if (!raw) raw = fixedWho;

    const UNKNOWN_WHO = '制作者不明';
const unknownPos = new Map();
const unknownFile = 'tools/designer-unknown.json';
if (fs.existsSync(unknownFile)) {
  for (const item of JSON.parse(fs.readFileSync(unknownFile, 'utf8'))) {
    unknownPos.set(norm(item.title), new Set(item.diffs || []));
  }
}
function isUnknownChart(titleKey, diff) {
  const pos = unknownPos.get(titleKey);
  return !!(pos && pos.has(diff));
}

// wiki 由来里的「ND名義(MAS)「クレジット」(人物)」——已经翻过的数据里就有，
// 用来补 c2s / 朋友数据都对不上的空白谱
const commentWho = (() => {
  const map = new Map();
  const file = 'tools/designer-from-comments.json';
  if (!fs.existsSync(file)) return () => '';
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [title, entry] of Object.entries(raw)) {
    map.set(title, entry);
  }
  return (titleKey, diff) => {
    const e = map.get(titleKey);
    if (!e || !e[diff]) return '';
    return e[diff].person || '';
  };
})();

const who = fixedWho || resolveWho(raw) || teamOf(raw) || commentWho(key, diff) || (isUnknownChart(key, diff) ? UNKNOWN_WHO : '');
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

// 团队名义 / 制作者不明：数据里有就把它们排到队伍末尾
for (const pseudo of [TEAM_WHO, '制作者不明']) {
  const songsSet = whoSongs.get(pseudo);
  if (!songsSet || !songsSet.size) continue;
  designers.push({
    name: pseudo,
    id: pseudo === TEAM_WHO ? 'nd-team' : 'nd-unknown',
    charts: whoCharts.get(pseudo) || 0,
    songs: songsSet.size,
    aliases: 0,
    pseudo: true,
  });
}

// 已经进合作数据的名义（A vs B / supported by …）不算「待指派」，
// 它们在「仅显示合作」里有自己的展示方式
const collabData = (function () {
  try {
    return JSON.parse(fs.readFileSync('source/assets/data/collab.json', 'utf8')).songs || {};
  } catch (e) {
    return {};
  }
})();
const coveredByCollab = new Set();
for (const [title, entry] of Object.entries(songsOut)) {
  const c = collabData[title] || {};
  for (const [diff, cell] of Object.entries(entry)) {
    if (cell.who || !cell.raw) continue;
    const people = c[diff];
    if (people && people.length >= 2) coveredByCollab.add(norm(cell.raw));
  }
}

// 用户新增的谱师（不在朋友那份名单里）
// 只写合作谱的也要能出现在面板上，否则「仅显示合作」里点不到他
const collabCount = (() => {
  const m = new Map();
  for (const entry of Object.values(collabData)) {
    for (const people of Object.values(entry)) {
      if (!Array.isArray(people)) continue;
      for (const p of people) {
        if (!m.has(p)) m.set(p, new Set());
      }
    }
  }
  for (const [title, entry] of Object.entries(collabData)) {
    for (const [diff, people] of Object.entries(entry)) {
      if (!Array.isArray(people)) continue;
      for (const p of people) m.get(p).add(title + '.' + diff);
    }
  }
  return m;
})();
for (const d of manualDesigners) {
  const solo = whoSongs.get(d.name);
  const collabSet = collabCount.get(d.name) || new Set();
  if (collabSet.size && !solo) {
    // 只有合作谱：用它自己的合作条目补上（不重复计已有的单人曲）
  }
  const total = new Set([...(solo || []), ...collabSet]);
  if (!total.size) continue;
  designers.push({
    name: d.name,
    id: 'manual-' + d.name,
    charts: whoCharts.get(d.name) || 0,
    songs: total.size,
    aliases: (d.aliases || []).length,
  });
}
designers.sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));
const loose = [...looseSongs.entries()]
  .filter(([name]) => !coveredByCollab.has(norm(name)))
  .map(([name, set]) => ({ name, songs: set.size }))
  .sort((a, b) => b.songs - a.songs || a.name.localeCompare(b.name, 'ja'));

// c2s 里有、但站内没有任何曲目挂着它的名义：只留一份备查，不进面板
// （之前这些会把「其他名义」从 47 撑到 291，面板上其实根本不显示）
const seenLoose = new Set(loose.map((x) => norm(x.name)));
const c2sOnly = [];
for (const [k, who] of Object.entries(c2s)) {
  if (!who) continue;
  if (resolveWho(who)) continue;
  if (teamOf(who)) continue;
  if (seenLoose.has(norm(who))) continue;
  seenLoose.add(norm(who));
  c2sOnly.push(who);
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
  c2sOnly,
  songs: songsOut,
};

fs.mkdirSync('source/assets/data', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload), 'utf8');
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log('谱师', designers.length, '| 曲目', Object.keys(songsOut).length, '| loose', loose.length, '|', kb, 'KB');
console.log('前 8:', designers.slice(0, 8).map((d) => d.name + '(' + d.songs + ')').join(' / '));