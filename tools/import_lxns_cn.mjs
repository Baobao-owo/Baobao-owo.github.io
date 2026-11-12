// 从 lxns（maimai.lxns.net）拉国服 CHUNITHM 数据（截至 X-VERSE-X），用于国服 2027 定数
// 用法: node tools/import_lxns_cn.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'source/_data/chuni_cn.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const res = await fetch('https://maimai.lxns.net/api/v0/chunithm/song/list?notes=true', {
  headers: { 'User-Agent': UA, Accept: 'application/json' }
});
if (!res.ok) {
  console.error('拉取失败', res.status);
  process.exit(1);
}
const data = await res.json();
console.log('歌曲:', data.songs.length, '版本:', data.versions.length);

function normTitle(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'’”"・:：;；,，.。~～\-—_]/g, '');
}

const out = {
  source: 'maimai.lxns.net',
  version: 'X-VERSE-X',
  updated: new Date().toISOString().slice(0, 10),
  songs: {}
};

for (const s of data.songs) {
  const byDiff = {};
  for (const d of s.difficulties || []) {
    // 0=BASIC 1=ADVANCED 2=EXPERT 3=MASTER 4=ULTIMA
    const letter = ['B', 'A', 'E', 'M', 'U'][d.difficulty];
    if (!letter) continue;
    byDiff[letter] = { lv: d.level, v: d.level_value };
  }
  out.songs[normTitle(s.title)] = { t: s.title, a: s.artist, v: s.version, d: byDiff };
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 0), 'utf8');
console.log('写入', OUT, '条目', Object.keys(out.songs).length);
const sample = Object.values(out.songs).find((x) => /初音ミクの消失/.test(x.t));
console.log('示例:', sample && JSON.stringify(sample));
