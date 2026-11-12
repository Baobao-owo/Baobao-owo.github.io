// 追加解析：定数变更履历 / 可取得称号 / ND名义·称号由来
// 用法：node tools/wiki_extra_sections.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
const cacheDir = path.join(ROOT, '_tmp/wiki-cache');

const fileOf = (id) => crypto.createHash('md5').update(String(id)).digest('hex') + '.html';

const stripTags = (s) =>
  String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

function sliceSection(html, startText, endTexts) {
  const i = html.indexOf(startText);
  if (i === -1) return '';
  let end = html.length;
  for (const t of endTexts) {
    const j = html.indexOf(t, i + startText.length);
    if (j !== -1 && j < end) end = j;
  }
  return html.slice(i, end);
}

function parseTableWithBg(html) {
  const m = html.match(/<table[\s\S]*?<\/table>/);
  if (!m) return [];
  const rows = [];
  for (const tr of m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [];
    for (const c of tr[0].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)) {
      const attr = c[1] || '';
      const bgm = attr.match(/background-color\s*:\s*([^;"]+)/i);
      cells.push({ text: stripTags(c[2]), bg: bgm ? bgm[1].trim().toLowerCase() : '' });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function titleKind(bg) {
  if (!bg) return '';
  if (bg.includes('d3d3d3') || bg.includes('gray') || bg.includes('grey')) return 'gray';
  if (bg.includes('c0c0c0') || bg.includes('silver')) return 'silver';
  if (bg.includes('ffd700') || bg.includes('gold')) return 'gold';
  if (bg.includes('e5e4e2') || bg.includes('platinum') || bg.includes('e0e0e0')) return 'platinum';
  return '';
}

function parseTable(html) {
  const m = html.match(/<table[\s\S]*?<\/table>/);
  if (!m) return [];
  const rows = [];
  for (const tr of m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => stripTags(c[1]));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function parseListItems(html) {
  const out = [];
  for (const li of html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const raw = li[1];
    const text = stripTags(raw);
    if (text) out.push(text);
  }
  return out;
}

let done = 0;
for (const song of guide.songs) {
  const f = path.join(cacheDir, fileOf(song.id));
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (html.indexOf('取得できる称号') === -1 && html.indexOf('譜面定数変更履歴') === -1) continue;

  const historyHtml = sliceSection(html, '譜面定数変更履歴', ['取得できる称号', 'ND名義']);
  const titlesHtml = sliceSection(html, '取得できる称号', ['ND名義', '攻略', 'コメント']);
  const originsHtml = sliceSection(html, 'ND名義・称号の由来', ['攻略', 'コメント', '■']);

  const historyRows = parseTable(historyHtml);
  const historyNotes = [];
  const noteText = stripTags(historyHtml.replace(/<table[\s\S]*?<\/table>/, ''));
  if (noteText) {
    noteText
      .split(/(?=※|譜面定数)/)
      .map((s) => s.trim())
      .filter((s) => s && (s.startsWith('※') || s.startsWith('譜面定数')))
      .map((s) => s.replace(/^(譜面定数変更履歴|レベルの推移)[\s　]*/, '').trim())
      .filter(Boolean)
      .forEach((s) => historyNotes.push(s));
  }
  // 从「譜面定数 EXP【12.0(AIR～AMAZON)、…】」里取出各版本区间的精确定数
  const exact = {};
  const DIFF_OF = { BASIC: 'B', ADVANCED: 'A', EXPERT: 'E', MASTER: 'M', ULTIMA: 'U' };
  (historyNotes || []).forEach(function (note) {
    const m = note.match(/^譜面定数\s*([A-Z]{3,})\s*【([\s\S]*?)】/);
    if (!m) return;
    const letter = DIFF_OF[m[1]] || m[1].charAt(0);
    m[2].split('、').forEach(function (part) {
      const pm = part.match(/([\d.]+)\s*\(([^)]+)\)/);
      if (!pm) return;
      const value = pm[1];
      const range = pm[2].trim();
      exact[range] = exact[range] || {};
      exact[range][letter] = value;
    });
  });

  // 表头里的难度字母顺序，用来把精确值填进单元格
  const header = historyRows[0] || [];
  for (let ri = 1; ri < historyRows.length; ri++) {
    const range = historyRows[ri][0];
    const vals = exact[range] || {};
    for (let ci = 1; ci < historyRows[ri].length; ci++) {
      const letter = header[ci];
      if (vals[letter]) historyRows[ri][ci] = vals[letter];
    }
  }

  const historyIntro = [];

  const titlesRaw = parseTableWithBg(titlesHtml);
  const titlesRows = titlesRaw.map(function (r) { return r.map(function (c) { return c.text; }); });
  const titleKinds = titlesRaw.slice(1).map(function (r) { return titleKind(r[0] && r[0].bg); });
  const origins = parseListItems(originsHtml);

  const e = extra[song.id] || (extra[song.id] = {});
  if (historyRows.length) e.history = { rows: historyRows };
  if (titlesRows.length) {
    e.titles = titlesRows;
    e.title_kinds = titleKinds;
  }
  if (origins.length) e.origins = origins;
  done++;
}

// 给翻译准备的日文拼接文本
for (const key of Object.keys(extra)) {
  const e = extra[key];
  const ja = [];
  if (e.history && e.history.rows && e.history.rows.length > 1) {
    ja.push('【定数変更履歴】');
    e.history.rows.forEach((r) => ja.push(r.join(' | ')));
    (e.history.notes || []).forEach((n) => ja.push(n));
  }
  if (e.titles && e.titles.length > 1) {
    ja.push('【取得できる称号】');
    e.titles.forEach((r) => ja.push(r.join(' | ')));
  }
  if (e.origins && e.origins.length) {
    ja.push('【ND名義・称号の由来】');
    e.origins.forEach((o) => ja.push('- ' + o));
  }
  if (ja.length) e.wiki_extra_ja = ja.join('\n');
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
console.log('处理页面:', done, '| 有额外小节:', Object.keys(extra).filter((k) => extra[k].wiki_extra_ja).length);
const sample = extra['初音ミクの消失'];
if (sample) {
  console.log('sample history rows:', JSON.stringify(sample.history && sample.history.rows));
  console.log('sample titles:', JSON.stringify(sample.titles));
  console.log('sample origins:', JSON.stringify(sample.origins));
}
