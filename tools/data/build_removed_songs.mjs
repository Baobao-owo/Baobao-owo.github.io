// 生成删除曲数据：wiki 列表（曲名/艺术家/BPM/等级）+ 本地游戏数据（封面/等级校验）+ 已抓取的 wiki 单曲页（版本）
// 输出：source/_data/chuni_removed_songs.json
import fs from 'node:fs';
import path from 'node:path';

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-—_♣♠♥♦♡♢]/g, '');

const missing = JSON.parse(fs.readFileSync('_tmp/wiki/missing_songs.json', 'utf8'));
const game = JSON.parse(fs.readFileSync('_tmp/game/music.json', 'utf8'));
const parsedWiki = fs.existsSync('_tmp/wiki/parsed_songs.json')
  ? JSON.parse(fs.readFileSync('_tmp/wiki/parsed_songs.json', 'utf8'))
  : [];

const DATA = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const IDS = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8').replace(/^\uFEFF/, ''));
const C2S_DESIGNERS = JSON.parse(fs.readFileSync('_tmp/game/c2s-designers.json', 'utf8'));

const gameByTitle = new Map();
for (const g of game) gameByTitle.set(norm(g.title), g);
const wikiByTitle = new Map();
for (const w of parsedWiki) {
  wikiByTitle.set(norm(w.title), w);
  // wiki 有些标题带读音后缀，例如「]-[|/34<#!(ヒバチ)」
  const bare = String(w.title || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();
  if (bare && !wikiByTitle.has(norm(bare))) wikiByTitle.set(norm(bare), w);
}

const SECTION_CAT = {
  'POPS&ANIME': 'POPS & ANIME',
  niconico: 'niconico',
  VARIETY: 'VARIETY',
  'イロドリミドリ': 'イロドリミドリ',
  ORIGINAL: 'ORIGINAL',
};

const VERSION_MAP = [
  [/^(無印|CHUNITHM)/, 'CHUNITHM'],
  [/^CHUNITHM PLUS/, 'CHUNITHM PLUS'],
  [/^AIR\+/, 'AIR PLUS'],
  [/^AIR/, 'AIR'],
  [/^STAR\+/, 'STAR PLUS'],
  [/^STAR/, 'STAR'],
  [/^AMAZON\+/, 'AMAZON PLUS'],
  [/^AMAZON/, 'AMAZON'],
  [/^CRYSTAL\+/, 'CRYSTAL PLUS'],
  [/^CRYSTAL/, 'CRYSTAL'],
  [/^PARADISE\+|PARADISE LOST/, 'PARADISE LOST'],
  [/^PARADISE/, 'PARADISE'],
  [/^NEW\+/, 'CHUNITHM NEW PLUS'],
  [/^NEW/, 'CHUNITHM NEW'],
  [/^SUN\+/, 'SUN PLUS'],
  [/^SUN/, 'SUN'],
  [/^LUMINOUS\+/, 'LUMINOUS PLUS'],
  [/^LUMINOUS/, 'LUMINOUS'],
  [/^VERSE\+\+|X-VERSE-X/, 'X-VERSE-X'],
  [/^VERSE\+|X-VERSE/, 'X-VERSE'],
  [/^VERSE/, 'VERSE'],
  [/^Mate/, 'Mate'],
];

function mapVersion(text) {
  const t = String(text || '').trim();
  if (!t) return 'CHUNITHM';
  const first = t.split(/[～~]/)[0].trim();
  for (const [re, key] of VERSION_MAP) if (re.test(first)) return key;
  return 'CHUNITHM';
}

const DIFF_KEYS = [
  ['basic', 3],
  ['advanced', 4],
  ['expert', 5],
  ['master', 6],
  ['ultima', 7],
];

const seen = new Set();
// 站内已有的曲目不要重复导入
const siteTitles = new Set((DATA.songs || []).map((s) => norm(s.title)));
const out = [];

for (const row of missing) {
  const cells = row.cells;
  const title = (cells[0] || '').trim();
  if (!title) continue;
  const key = norm(title);
  if (seen.has(key)) continue;
  if (siteTitles.has(key)) continue;
  seen.add(key);

  const artist = (cells[1] || '').replace(/\s*\[cover.*?\]\s*$/i, '').trim() || cells[1] || '';
  const bpm = (cells[2] || '').replace(/[^\d.]/g, '');
  const lvFromList = cells.slice(3, 7).map((x) => String(x || '').trim());

  const g = gameByTitle.get(key);
  const w = wikiByTitle.get(key);
  const songId = IDS[title];

  // 谱师：来自 .c2s 头里的 CREATOR（游戏数据里唯一带谱师的地方）
  const designerOf = (diffIdx) => {
    if (songId === undefined) return '';
    return C2S_DESIGNERS[String(Number(songId)) + '_' + diffIdx] || '';
  };

  // 物量：wiki 单曲页的「Lv / 総数 / 内訳」表
  const wikiNotes = (w && Array.isArray(w.notes)) ? w.notes : [];
  const attachNotes = (sheet, i) => {
    const byLevel = wikiNotes.find((n) => String(n.level || '').trim() === String(sheet.level || '').trim());
    const pick = byLevel || wikiNotes[i];
    if (!pick) return;
    const toNum = (v) => {
      const n = Number(String(v == null ? '' : v).replace(/[^\d]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    sheet.notes = {
      tap: toNum(pick.tap),
      hold: toNum(pick.hold),
      slide: toNum(pick.slide),
      air: toNum(pick.air),
      flick: toNum(pick.flick),
      total: toNum(pick.total),
    };
  };

  // 等级：优先游戏数据（数字 + levelDecimal），否则 wiki 列表
  const sheets = [];
  if (g) {
    for (const sh of g.sheets || []) {
      const d = String(sh.diff || '').toLowerCase();
      if (!/basic|advanced|expert|master|ultima/.test(d)) continue;
      if (!sh.level) continue;
      const internal = sh.levelDecimal ? Number(sh.level) + sh.levelDecimal / 100 : Number(sh.level);
      const idx = DIFF_KEYS.findIndex(([k]) => k === d);
      const sheet = { difficulty: d, level: String(sh.level) + (sh.levelDecimal ? '' : ''), internalValue: internal, designer: designerOf(idx) };
      attachNotes(sheet, idx);
      sheets.push(sheet);
    }
  }
  if (!sheets.length) {
    DIFF_KEYS.forEach(([d, idx], i) => {
      const lv = lvFromList[i];
      // 只接受正常等级（数字或数字+），跳过「時」「避」「☆2」这类错位内容
      if (!lv || lv === '-' || !/^\d/.test(String(lv))) return;
      const num = Number(String(lv).replace(/\+/g, ''));
      const sheet = { difficulty: d, level: lv, internalValue: isNaN(num) ? null : num, designer: designerOf(i) };
      attachNotes(sheet, i);
      sheets.push(sheet);
    });
  }

  out.push({
    id: 'REMOVED:' + title,
    title,
    artist: artist || (g ? g.artist : ''),
    category: SECTION_CAT[row.section] || 'POPS & ANIME',
    genre: g ? g.genre : '',
    version: mapVersion(w ? w.version : ''),
    bpm: bpm || (w ? w.bpm : ''),
    release: w && w.release ? w.release.replace(/\//g, '-') : '',
    removedAt: w && w.removedAt ? w.removedAt : '',
    coverGame: g ? path.posix.join(g.dir, g.jacket || '') : '',
    sheets,
  });
}

fs.writeFileSync('_tmp/build/chuni_removed_songs.json', JSON.stringify(out, null, 1), {
  flag: 'w',
});
console.log('built:', out.length);
console.log('有封面来源:', out.filter((x) => x.coverGame).length);
console.log('有等级:', out.filter((x) => x.sheets.length).length);
console.log(JSON.stringify(out[0], null, 1).slice(0, 600));
