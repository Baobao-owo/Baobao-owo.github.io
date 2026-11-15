import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const write = (n, lines) => { fs.writeFileSync('_tmp/reports/' + n, lines.join('\r\n'), 'utf8'); console.log(n, lines.length - 1); };
const xml = J('_tmp/game/music-xml.json');
const chuni = J('source/_data/chuni.json');
const songs = chuni.songs;
const ids = J('source/_data/chuni_ids.json');
const removed = J('source/_data/chuni_removed_songs.json');
const all = { ...xml.mate, ...xml.mate_a300 };

// 1) releaseTag -> version 学习
const votes = new Map();
for (const s of songs) {
  const mid = ids[s.title];
  const rec = mid != null ? all[mid] : null;
  if (!rec || s.version == null || s.version === 'null') continue;
  const key = rec.releaseTag;
  if (!votes.has(key)) votes.set(key, new Map());
  const m = votes.get(key);
  m.set(s.version, (m.get(s.version) || 0) + 1);
}
const tagToVersion = new Map();
for (const [k, m] of votes) {
  const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
  tagToVersion.set(k, best[0]);
}
console.log('learned releaseTag mappings', tagToVersion.size);

// 2) 版本 null 回填
const nullSongs = songs.filter(s => s.version == null || s.version === 'null');
const fill = [];
const unmapped = [];
for (const s of nullSongs) {
  const mid = ids[s.title];
  const rec = mid != null ? all[mid] : null;
  if (!rec) { unmapped.push([s.title, mid ?? '', 'no xml']); continue; }
  const v = tagToVersion.get(rec.releaseTag);
  if (!v) { unmapped.push([s.title, mid ?? '', rec.releaseTag]); continue; }
  fill.push([s.title, mid ?? '', rec.releaseTag, v]);
}
{
  const lines = ['曲名\tmusicId\treleaseTag\t回填版本'];
  lines.push(...fill.map(r => r.join('\t')));
  lines.push('', '未能回填', '曲名\tmusicId\t原因');
  lines.push(...unmapped.map(r => r.join('\t')));
  write('version-backfill.tsv', lines);
}

// 3) A300 差集
const currentRemoved = new Set(removed.map(r => r.id));
const a300 = xml.mate_a300;
const mateIds = new Set(Object.keys(xml.mate).map(Number));
const removedIds = new Set(removed.map(r => ids[r.title]).filter(x => x != null));
const diff = [];
for (const [midStr, rec] of Object.entries(a300)) {
  const mid = Number(midStr);
  if (mateIds.has(mid)) continue; // 本体也有，不算删除
  if (removedIds.has(mid)) continue;
  diff.push([mid, rec.name, rec.releaseTag, rec.sheets.filter(s => s.enable).map(s => s.type).join('/')]);
}
{
  const lines = ['musicId\t曲名\treleaseTag\t有谱面'];
  lines.push(...diff.map(r => r.join('\t')));
  write('a300-missing.tsv', lines);
}
console.log('a300 new removed candidates', diff.length);

// 4) 国服 vs 日服定数
const typeIdx = { Basic: 'basic', Advanced: 'advanced', Expert: 'expert', Master: 'master', Ultima: 'ultima' };
const jpAll = { ...xml.mate, ...xml.mate_a300 };
const cnAll = { ...xml.xvx, ...xml.xvx_a300 };
const midToTitle = new Map();
for (const s of songs) { const m = ids[s.title]; if (m != null) midToTitle.set(m, s.title); }
for (const r of removed) { const m = ids[r.title]; if (m != null) midToTitle.set(m, r.title); }
const cnDiffs = [];
let cnCompared = 0;
for (const [midStr, jp] of Object.entries(jpAll)) {
  const mid = Number(midStr);
  const cn = cnAll[mid];
  if (!cn) continue;
  for (const jpSheet of jp.sheets) {
    if (!jpSheet.enable) continue;
    const key = typeIdx[jpSheet.type];
    if (!key) continue;
    const cnSheet = cn.sheets.find(x => x.type === jpSheet.type);
    if (!cnSheet || !cnSheet.enable) continue;
    cnCompared++;
    if (Math.abs(cnSheet.const - jpSheet.const) > 0.001) {
      cnDiffs.push([mid, midToTitle.get(mid) || jp.name, key, jpSheet.const.toFixed(2), cnSheet.const.toFixed(2)]);
    }
  }
}
{
  const lines = ['musicId\t曲名\t难度\t日服定数\t国服定数'];
  lines.push(...cnDiffs.map(r => r.join('\t')));
  write('cn-vs-jp-consts.tsv', lines);
}
console.log('cn compared', cnCompared, 'diffs', cnDiffs.length);
