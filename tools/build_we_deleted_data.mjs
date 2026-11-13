// 把 wiki 的「WORLD'S END(配信終了)」名单写成数据文件，供站点标记已删除的 WE 谱
import fs from 'node:fs';

const ROOT = process.cwd();
const raw = JSON.parse(fs.readFileSync(ROOT + '/_tmp/we-deleted.json', 'utf8'));
const guide = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni.json', 'utf8'));

const JUNK = /掲示板|基本の|楽曲追加|^10\/|\/$/;
const rows = raw.filter((r) => r && r.title && !JUNK.test(r.title));

function norm(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[!！?？:：;；,，.。~～\-–—_]/g, '');
}

const out = { source: "wikiwiki WORLD'S END(備考・配信終了)", updated: new Date().toISOString().slice(0, 10), songs: [] };
const seen = new Set();
for (const r of rows) {
  const k = norm(r.title);
  if (seen.has(k)) continue;
  seen.add(k);
  out.songs.push({ title: r.title, attr: r.attr });
}

fs.writeFileSync(ROOT + '/source/_data/chuni_we_deleted.json', JSON.stringify(out, null, 1), 'utf8');
console.log('写入删除 WE:', out.songs.length);
