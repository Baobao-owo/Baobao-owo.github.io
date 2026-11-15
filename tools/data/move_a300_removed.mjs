// 把 A300 里确认已删除、但站内仍标为现存的曲目移到删除曲列表
import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const cat = J('_tmp/reports/a300-categorize.json');
const xml = J('_tmp/game/music-xml.json');
const c2s = J('_tmp/game/c2s-designers-all.json');
const chuni = J('source/_data/chuni.json');
const removed = J('source/_data/chuni_removed_songs.json');

const moveTitles = new Set(cat.sameIdLive.map(x => x[2]));
const beforeLive = chuni.songs.length;
const moved = [];
chuni.songs = chuni.songs.filter(s => {
  if (!moveTitles.has(s.title)) return true;
  moved.push(s);
  return false;
});
const removedTitles = new Set(removed.map(r => r.title));
const DIFF_KEY = { B: 'basic', A: 'advanced', E: 'expert', M: 'master', U: 'ultima' };
const DIFFIDX = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4 };
const entries = [];
for (const s of moved) {
  if (removedTitles.has(s.title)) continue;
  entries.push(Object.assign({}, s, {
    id: 'REMOVED:' + s.title,
    removedFromMate: true,
  }));
}
// 779：本体没有、A300 才有、也不在删除曲里的普通曲目
const rec = xml.mate_a300[779];
if (rec && !removedTitles.has(rec.name)) {
  const sheets = rec.sheets.filter(x => x.enable && DIFF_KEY[x.type[0]]).map(x => {
    const d = DIFF_KEY[x.type[0]];
    const designer = String(c2s[`779_${DIFFIDX[d]}`] || '').replace(/^"|"$/g, '');
    return { type: 'std', difficulty: d, level: String(x.level), internal: x.const.toFixed(1), internalValue: x.const, designer, notes: null };
  });
  entries.push({
    id: 'REMOVED:' + rec.name,
    title: rec.name,
    artist: rec.artist,
    category: 'ORIGINAL',
    version: 'CHUNITHM',
    bpm: '',
    release: '',
    cover: '',
    removedFromMate: true,
    sheets,
  });
}
fs.writeFileSync('source/_data/chuni.json', JSON.stringify(chuni), 'utf8');
fs.writeFileSync('source/_data/chuni_removed_songs.json', JSON.stringify(removed.concat(entries), null, 1), 'utf8');
console.log('live', beforeLive, '->', chuni.songs.length, 'moved', moved.length, 'new removed entries', entries.length, 'removed total', removed.length + entries.length);
console.log('notes null entries', entries.filter(e => !e.sheets || !e.sheets.length).length);
