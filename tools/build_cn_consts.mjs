import fs from 'node:fs';
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const ids = J('source/_data/chuni_ids.json');
const chuni = J('source/_data/chuni.json');
const removed = J('source/_data/chuni_removed_songs.json');
const xml = J('_tmp/game/music-xml.json');
const jp = { ...xml.mate, ...xml.mate_a300 };
const cn = { ...xml.xvx, ...xml.xvx_a300 };
const typeKey = { Basic: 'basic', Advanced: 'advanced', Expert: 'expert', Master: 'master', Ultima: 'ultima' };
const titleByMid = new Map();
for (const s of [...chuni.songs, ...removed]) {
  const m = ids[s.title];
  if (m != null && m !== '' && m !== '0') titleByMid.set(Number(m), s.title);
}
const out = {};
let diffs = 0;
for (const [midStr, j] of Object.entries(jp)) {
  const c = cn[midStr];
  if (!c) continue;
  const title = titleByMid.get(Number(midStr));
  if (!title) continue;
  for (const js of j.sheets) {
    if (!js.enable) continue;
    const k = typeKey[js.type];
    if (!k) continue;
    const cs = c.sheets.find(x => x.type === js.type);
    if (!cs || !cs.enable) continue;
    if (Math.abs(cs.const - js.const) < 0.001) continue;
    out[title] = out[title] || {};
    out[title][k] = Number(cs.const.toFixed(2));
    diffs++;
  }
}
fs.writeFileSync('source/_data/chuni_cn_consts.json', JSON.stringify(out), 'utf8');
console.log('songs with cn diffs', Object.keys(out).length, 'sheets', diffs, 'bytes', fs.statSync('source/_data/chuni_cn_consts.json').size);
