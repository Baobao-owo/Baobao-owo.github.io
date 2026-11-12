// 把 wiki 的定数履历按「精确定数」分段展开：
// 例如 EXP 12.0(AIR～AMAZON) / MAS 13.6(AIR)、13.4(AIR+～PARADISE×)
// → AIR | AIR+～AMAZON | AMAZON+～PARADISE× | NEW～
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
const cacheDir = path.join(ROOT, '_tmp/wiki-cache');
const fileOf = (id) => crypto.createHash('md5').update(String(id)).digest('hex') + '.html';

const VERSIONS = (guide.versions || []).map((v) => v.key);
const ALIAS = {
  'AIR+': 'AIR PLUS',
  'AMAZON+': 'AMAZON PLUS',
  'STAR+': 'STAR PLUS',
  'CRYSTAL+': 'CRYSTAL PLUS',
  'PARADISE×': 'PARADISE LOST',
  'PARADISE+': 'PARADISE LOST',
  'NEW': 'CHUNITHM NEW',
  'NEW+': 'CHUNITHM NEW PLUS',
  'SUN+': 'SUN PLUS',
  'LUMINOUS+': 'LUMINOUS PLUS',
  'CHUNITHM+': 'CHUNITHM PLUS'
};

function versionIndex(token) {
  const t = String(token).trim().replace(/[～~]$/, '');
  const norm = ALIAS[t] || t;
  const i = VERSIONS.indexOf(norm);
  if (i >= 0) return i;
  // 再宽松匹配一次
  const j = VERSIONS.findIndex((v) => v.toUpperCase() === norm.toUpperCase());
  return j >= 0 ? j : -1;
}

function parseRange(text) {
  const t = String(text).trim();
  if (!t) return null;
  if (t.includes('～')) {
    const [a, b] = t.split('～').map((s) => s.trim());
    const ai = versionIndex(a);
    const bi = b ? versionIndex(b) : VERSIONS.length - 1;
    if (ai < 0) return null;
    return { a: ai, b: bi < 0 ? VERSIONS.length - 1 : bi, label: t };
  }
  const i = versionIndex(t);
  if (i < 0) return null;
  return { a: i, b: i, label: t };
}

const DIFF_OF = { BASIC: 'B', ADVANCED: 'A', EXPERT: 'E', MASTER: 'M', ULTIMA: 'U' };
const stripTags = (s) =>
  String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

let done = 0;
for (const song of guide.songs) {
  const f = path.join(cacheDir, fileOf(song.id));
  if (!fs.existsSync(f)) continue;
  const e = extra[song.id];
  if (!e || !e.history || !e.history.rows || e.history.rows.length < 2) continue;

  const html = fs.readFileSync(f, 'utf8');
  const i = html.indexOf('譜面定数変更履歴');
  if (i === -1) continue;
  const seg = html.slice(i, i + 12000);
  const text = stripTags(seg.replace(/<table[\s\S]*?<\/table>/, ''));

  // 把「譜面定数 EXP【12.0(AIR～AMAZON)、…】」拆成 {letter: [{a,b,label,value}]}
  const byDiff = {};
  for (const m of text.matchAll(/譜面定数\s*([A-Z]{3,})\s*【([\s\S]*?)】/g)) {
    const letter = DIFF_OF[m[1]] || m[1].charAt(0);
    for (const part of m[2].split('、')) {
      const pm = part.match(/([\d.]+)\s*[(（]([^)）]+)[)）]/);
      if (!pm) continue;
      const range = parseRange(pm[2]);
      if (!range) continue;
      (byDiff[letter] = byDiff[letter] || []).push({ ...range, value: pm[1] });
    }
  }

  const header = e.history.rows[0];
  const rows = e.history.rows.slice(1);

  // 原始行的区间和标记
  const orig = rows
    .map((r) => {
      const range = parseRange(r[0]);
      if (!range) return null;
      return { range, cells: r.slice(1) };
    })
    .filter(Boolean);

  // 所有分界点（起点 + 闭合终点 + 1）
  const points = new Set();
  byDiff && Object.values(byDiff).forEach((list) =>
    list.forEach((x) => {
      points.add(x.a);
      if (x.b < VERSIONS.length - 1) points.add(x.b + 1);
    })
  );
  orig.forEach((o) => {
    points.add(o.range.a);
    if (o.range.b < VERSIONS.length - 1) points.add(o.range.b + 1);
  });
  const starts = Array.from(points).sort((a, b) => a - b);
  if (starts.length < 2) continue;

  const newRows = [header];
  for (let k = 0; k < starts.length; k++) {
    const a = starts[k];
    const b = k + 1 < starts.length ? starts[k + 1] - 1 : VERSIONS.length - 1;
    const label = a === b ? VERSIONS[a] : VERSIONS[a] + '～' + (b >= VERSIONS.length - 1 ? '' : VERSIONS[b]);
    const cells = [];
    for (let ci = 1; ci < header.length; ci++) {
      const letter = header[ci];
      const list = byDiff[letter] || [];
      const hit = list.find((x) => x.a <= a && b <= x.b);
      if (hit) {
        cells.push(hit.value);
        continue;
      }
      const origin = orig.find((o) => o.range.a <= a && b <= o.range.b);
      cells.push(origin ? origin.cells[ci - 1] : '—');
    }
    newRows.push([label, ...cells]);
  }

  e.history_expanded = newRows;
  done++;
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
console.log('展开定数履历:', done);
const s = extra['初音ミクの消失'];
if (s && s.history_expanded) console.log(JSON.stringify(s.history_expanded, null, 0));
