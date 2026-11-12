// 解析 _tmp/wiki-cache 里的页面，写进 source/_data/chuni_extra.json
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
let extra = {};
try {
  extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
} catch (e) {}

const cacheDir = path.join(ROOT, '_tmp/wiki-cache');
if (!fs.existsSync(cacheDir)) {
  console.error('没有缓存目录，先跑 wiki_targets + wiki_fetch');
  process.exit(1);
}

const fileOf = (id) => crypto.createHash('md5').update(String(id)).digest('hex') + '.html';

function htmlToText(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h\d|li|table)>/gi, '\n')
    .replace(/<\/(td|th)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));
  return s
    .split('\n')
    .map((line) => line.replace(/[ \t\u3000]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function pickContent(html) {
  const i = html.indexOf('id="content"');
  if (i === -1) return '';
  let seg = html.slice(i, i + 60000);
  const endMark = seg.search(/id="comment|id="footer"|class="zazawaza/);
  if (endMark > 200) seg = seg.slice(0, endMark);
  let text = htmlToText(seg);
  text = text.replace(/^id="content"\s*/, '');

  const infoStart = text.search(/^情報$/m);
  const detailStart = text.search(/^詳細$/m);
  let commentary = '';
  if (infoStart >= 0) {
    const end = detailStart > infoStart ? detailStart : Math.min(text.length, infoStart + 2000);
    commentary = text.slice(infoStart + 2, end).trim();
  }
  const designers = (text.match(/譜面作者【([\s\S]*?)】/) || [])[1] || '';
  const levels = (text.match(/譜面定数【([\s\S]*?)】/) || [])[1] || '';

  const parts = [];
  if (commentary) parts.push(commentary);
  if (designers) parts.push('譜面作者：' + designers.trim());
  if (levels) parts.push('譜面定数：' + levels.trim());
  return parts.join('\n').trim();
}

let written = 0;
for (const song of guide.songs) {
  const f = path.join(cacheDir, fileOf(song.id));
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  const text = pickContent(html);
  if (!text) continue;
  extra[song.id] = extra[song.id] || {};
  extra[song.id].wiki_jp = text;
  extra[song.id].wiki_title = song.title;
  written++;
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
const keys = Object.keys(extra).filter((k) => extra[k] && extra[k].wiki_jp);
console.log('写入 wiki_jp:', written, '| 总数:', keys.length);
if (keys.length) {
  console.log('示例 (' + keys[0] + '):\n' + String(extra[keys[0]].wiki_jp).slice(0, 500));
}
