// 生成 wiki 抓取任务清单：node tools/wiki_targets.mjs --limit 10 [--max-level 15] [--force]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? (args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const LIMIT = Number(opt('limit', 0)) || 0;
const MAX_LEVEL = Number(opt('max-level', 0)) || 0;
const FORCE = !!opt('force', false);

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
let extra = {};
try {
  extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
} catch (e) {}

function fileOf(id) {
  return crypto.createHash('md5').update(String(id)).digest('hex') + '.html';
}

let songs = guide.songs;
if (MAX_LEVEL) {
  songs = songs.filter((s) => {
    const max = Math.max.apply(null, s.sheets.map((sh) => Number(sh.internalValue) || 0).concat([0]));
    return max >= MAX_LEVEL;
  });
}
if (LIMIT) songs = songs.slice(0, LIMIT);

const cacheDir = path.join(ROOT, '_tmp/wiki-cache');
const targets = [];
for (const s of songs) {
  const f = fileOf(s.id);
  const cached = fs.existsSync(path.join(cacheDir, f));
  const have = extra[s.id] && extra[s.id].wiki_jp;
  if (!FORCE && (cached || have)) continue;
  targets.push({
    id: s.id,
    title: s.title,
    file: f,
    url: 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(s.title)
  });
}

fs.mkdirSync(path.join(ROOT, '_tmp'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '_tmp/wiki-targets.json'), JSON.stringify(targets, null, 1), 'utf8');
console.log('targets:', targets.length);
