// 解析 _tmp/wiki-cache 里的页面，写进 source/_data/chuni_extra.json
// 输出：wiki_info（楽曲情報表）、wiki_comment（情報段落）、wiki_designers、wiki_levels、wiki_jp（纯文本兜底）
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
  if (i === -1) return { text: '' };
  let seg = html.slice(i, i + 60000);
  const endMark = seg.search(/id="comment|id="footer"|class="zazawaza/);
  if (endMark > 200) seg = seg.slice(0, endMark);
  return { text: htmlToText(seg).replace(/^id="content"\s*/, '') };
}

const INFO_KEYS = ['ジャンル', 'タイトル', '原曲', 'アーティスト', 'BPM', '解禁方法'];

function parseWiki(text) {
  const lines = text.split('\n');
  const info = {};
  let commentLines = [];
  let inComment = false;

  for (const line of lines) {
    const key = INFO_KEYS.find((k) => line.startsWith(k + ' ') || line === k);
    if (key && !info[key]) {
      info[key] = line.slice(key.length).trim();
      continue;
    }
    if (/^情報$/.test(line)) {
      inComment = true;
      continue;
    }
    if (inComment) {
      if (/^詳細$/.test(line) || /^譜面作者/.test(line) || /^譜面定数/.test(line)) {
        inComment = false;
      } else {
        commentLines.push(line);
      }
    }
  }

  const designersRaw = (text.match(/譜面作者【([\s\S]*?)】/) || [])[1] || '';
  const levelsRaw = (text.match(/譜面定数【([\s\S]*?)】/) || [])[1] || '';

  function parsePairs(raw) {
    const out = {};
    String(raw)
      .split(/、|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((seg) => {
        const m = seg.match(/^([A-Z]{3})\s*…\s*(.+)$/);
        if (m) out[m[1]] = m[2].trim();
        else if (seg) out[seg] = '';
      });
    return out;
  }

  return {
    info,
    comment: commentLines.join('\n').trim(),
    designers: parsePairs(designersRaw),
    levels: parsePairs(levelsRaw)
  };
}

let written = 0;
for (const song of guide.songs) {
  const f = path.join(cacheDir, fileOf(song.id));
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  const { text } = pickContent(html);
  if (!text) continue;
  const parsed = parseWiki(text);
  if (!parsed.comment && !Object.keys(parsed.info).length) continue;

  extra[song.id] = extra[song.id] || {};
  extra[song.id].wiki_title = song.title;
  extra[song.id].wiki_info = parsed.info;
  extra[song.id].wiki_comment = parsed.comment;
  extra[song.id].wiki_designers = parsed.designers;
  extra[song.id].wiki_levels = parsed.levels;
  extra[song.id].wiki_jp = [
    parsed.comment,
    parsed.designers && Object.keys(parsed.designers).length
      ? '譜面作者：' + Object.keys(parsed.designers).map((k) => k + ' …' + parsed.designers[k]).join('、')
      : '',
    parsed.levels && Object.keys(parsed.levels).length
      ? '譜面定数：' + Object.keys(parsed.levels).map((k) => k + ' …' + parsed.levels[k]).join('、')
      : ''
  ]
    .filter(Boolean)
    .join('\n');
  written++;
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
const keys = Object.keys(extra).filter((k) => extra[k] && extra[k].wiki_jp);
console.log('写入:', written, '| 有 wiki 的总数:', keys.length);
if (keys.length) {
  const s = extra[keys[0]];
  console.log('示例', keys[0]);
  console.log('info:', JSON.stringify(s.wiki_info));
  console.log('designers:', JSON.stringify(s.wiki_designers), 'levels:', JSON.stringify(s.wiki_levels));
  console.log('comment:', String(s.wiki_comment).slice(0, 160));
}
