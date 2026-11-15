const fs = require('fs');
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const ids = J('source/_data/chuni_ids.json');
const removed = J('source/_data/chuni_removed_songs.json');
const chuni = J('source/_data/chuni.json');
const xml = J('_tmp/game/music-xml.json');
const a300 = xml.mate_a300;
const mateBody = xml.mate;
const liveTitles = new Set(chuni.songs.map(s => s.title));
const removedTitles = new Set(removed.map(r => r.title));
const removedMids = new Set(removed.map(r => ids[r.title]).filter(x => x != null));
const out = [];
let alsoBody = 0, alreadyRemoved = 0, liveUnderId = 0;
for (const [midStr, rec] of Object.entries(a300)) {
  const mid = Number(midStr);
  if (mateBody[mid]) { alsoBody++; continue; }
  if (removedMids.has(mid)) { alreadyRemoved++; continue; }
  if (liveTitles.has(rec.name)) { liveUnderId++; out.push([mid, rec.name, rec.releaseTag, 'LIVE_MATCH']); continue; }
  if (removedTitles.has(rec.name)) { out.push([mid, rec.name, rec.releaseTag, 'REMOVED_MATCH']); continue; }
  out.push([mid, rec.name, rec.releaseTag, 'NEW']);
}
const lines = ['musicId\t曲名\treleaseTag\t判定'];
lines.push(...out.map(r => r.join('\t')));
fs.writeFileSync('_tmp/reports/a300-missing.tsv', lines.join('\r\n'), 'utf8');
console.log('a300', Object.keys(a300).length, 'alsoInBody', alsoBody, 'alreadyRemovedById', alreadyRemoved, 'liveTitleMatch', liveUnderId, 'candidates', out.length);
const counts = {};
for (const r of out) counts[r[3]] = (counts[r[3]] || 0) + 1;
console.log(counts);
