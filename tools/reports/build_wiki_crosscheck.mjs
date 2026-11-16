// 对比 wiki 原文里的「譜面作者 / 譜面定数」与站内数据（游戏 c2s 原文 / 定数）。
// 输出 _tmp/reports/wiki-author-diff.tsv、wiki-const-diff.tsv 与汇总计数。
// 用法：node tools/reports/build_wiki_crosscheck.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source', '_data', 'chuni_extra.json'), 'utf8'));
const live = JSON.parse(fs.readFileSync(path.join(ROOT, 'source', '_data', 'chuni.json'), 'utf8'));
const REPORT_DIR = path.join(ROOT, '_tmp', 'reports');
fs.mkdirSync(REPORT_DIR, { recursive: true });

const KEYMAP = {
  B: 'basic', BAS: 'basic', BASIC: 'basic',
  A: 'advanced', ADV: 'advanced', ADVANCED: 'advanced',
  E: 'expert', EXP: 'expert', EXPERT: 'expert',
  M: 'master', MAS: 'master', MASTER: 'master',
  U: 'ultima', ULT: 'ultima', ULTIMA: 'ultima'
};
const byTitle = new Map(live.songs.map((s) => [s.title, s]));

function norm(s) {
  return String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\swith\b/g, '')
    .replace(/[\s・,，、]/g, '')
    .replace(/supportedby|cooperatedwith|cooperatedby/g, 'cooperated')
    .replace(/×/g, 'x');
}

function parsePairs(line) {
  const out = {};
  const parts = line.split(/\s*[、,，]\s*(?=[A-Z]{1,3}\s*(?:…|\.{2,}|[:：]))/);
  for (const part of parts) {
    const m = part.trim().match(/^([A-Z]{1,3})\s*(?:…|\.{2,}|:|：)\s*(.+)$/);
    if (!m) continue;
    const d = KEYMAP[m[1]];
    if (!d) continue;
    out[d] = m[2].replace(/\s*\*+\d+\s*$/, '').trim();
  }
  return out;
}

const authors = [];
const consts = [];
const stat = { authorDiff: 0, authorFill: 0, authorSame: 0, authorFormat: 0, constDiff: 0, constSame: 0, constMissing: 0 };

for (const [key, value] of Object.entries(extra)) {
  if (!value || typeof value.wiki_jp !== 'string') continue;
  const lines = value.wiki_jp.split('\n').map((s) => s.trim());
  const title = key.replace(/^\(WE\)\s*/, '');
  const song = byTitle.get(title);
  const authorLine = lines.find((l) => /譜面作者[:：]/.test(l));
  const constLine = lines.find((l) => /譜面定数[:：]/.test(l));
  if (song) {
    if (authorLine) {
      const wiki = parsePairs(authorLine.split(/[:：]/).slice(1).join(':'));
      for (const sh of song.sheets) {
        const L = sh.difficulty;
        if (!(L in KEYMAP) && Object.keys(KEYMAP).some((k) => KEYMAP[k] === L)) {
          // normal difficulty keys are already basic/advanced/...; handled below
        }
        const w = wiki[L];
        if (!w) continue;
        const cur = String(sh.designer || '').trim();
        if (!cur || cur === '-' || cur === '/') {
          stat.authorFill++;
          authors.push([song.title, L, cur, w, 'fill']);
        } else if (norm(cur) === norm(w)) {
          stat.authorFormat++;
        } else {
          stat.authorDiff++;
          authors.push([song.title, L, cur, w, 'diff']);
        }
      }
    }
    if (constLine) {
      const wiki = parsePairs(constLine.split(/[:：]/).slice(1).join(':'));
      for (const sh of song.sheets) {
        const w = wiki[sh.difficulty];
        if (w == null) continue;
        const num = Number(String(w).replace(/[^\d.]/g, ''));
        const cur = Number(sh.internalValue);
        if (isNaN(num)) continue;
        if (sh.internalValue == null || isNaN(cur)) {
          stat.constMissing++;
          consts.push([song.title, sh.difficulty, '', String(num), 'missing']);
        } else if (Math.abs(cur - num) > 0.001) {
          stat.constDiff++;
          consts.push([song.title, sh.difficulty, cur.toFixed(2), num.toFixed(2), 'diff']);
        } else stat.constSame++;
      }
    }
  }
}

const tsv = (rows, header) => [header, ...rows.map((r) => r.join('\t'))].join('\n');
fs.writeFileSync(path.join(REPORT_DIR, 'wiki-author-diff.tsv'), tsv(authors, 'song\tdifficulty\tgame\twiki\tkind'), 'utf8');
fs.writeFileSync(path.join(REPORT_DIR, 'wiki-const-diff.tsv'), tsv(consts, 'song\tdifficulty\tgame\twiki\tkind'), 'utf8');
fs.writeFileSync(path.join(REPORT_DIR, 'wiki-crosscheck.json'), JSON.stringify({ stat, authors, consts }, null, 1), 'utf8');
console.log(JSON.stringify(stat));
console.log('author rows', authors.length, 'const rows', consts.length);
