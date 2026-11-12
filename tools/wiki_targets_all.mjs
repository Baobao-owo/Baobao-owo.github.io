// 生成全量抓取清单：所有还没有缓存/wiki 内容的曲目
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const cacheDir = path.join(ROOT, '_tmp/wiki-cache');
fs.mkdirSync(cacheDir, { recursive: true });

const fileOf = (id) => crypto.createHash('md5').update(String(id)).digest('hex') + '.html';

let extra = {};
try {
  extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8'));
} catch (e) {}

const targets = [];
for (const s of guide.songs) {
  const f = fileOf(s.id);
  if (fs.existsSync(path.join(cacheDir, f))) continue;
  if (extra[s.id] && extra[s.id].wiki_comment) continue;
  targets.push({
    id: s.id,
    title: s.title,
    artist: s.artist,
    version: s.version,
    file: f,
    url: 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(s.title)
  });
}

fs.writeFileSync(path.join(ROOT, '_tmp/wiki-targets.json'), JSON.stringify(targets, null, 1), 'utf8');
console.log('待抓取:', targets.length, '首');
