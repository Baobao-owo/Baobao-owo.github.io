// 把 collab.json 里用全称当键的难度统一成 b/a/e/m/u
import fs from 'node:fs';

const MAP = { basic: 'b', advanced: 'a', expert: 'e', master: 'm', ultima: 'u' };
const p = 'source/assets/data/collab.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
let fixed = 0;

for (const [title, rec] of Object.entries(c.songs || {})) {
  for (const k of Object.keys(rec)) {
    const kk = Map.prototype.has.call(new Map(Object.entries(MAP)), k) ? MAP[k] : null;
    if (!kk) continue;
    const merged = [...new Set((rec[kk] || []).concat(rec[k]))];
    rec[kk] = merged;
    delete rec[k];
    fixed++;
  }
}

fs.writeFileSync(p, JSON.stringify(c, null, 1) + '\n', 'utf8');
console.log('规范化难度键:', fixed, '| 合作曲:', Object.keys(c.songs).length);
