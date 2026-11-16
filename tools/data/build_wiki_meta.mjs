// 从 chuni_extra.json 的 wiki 原文里抽出「制作名单」与「追加/配信日期」，
// 生成站内可直接读的 chuni_credits.json / chuni_periods.json。
// 用法：node tools/data/build_wiki_meta.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const EXTRA = path.join(ROOT, 'source', '_data', 'chuni_extra.json');
const OUT_CREDITS = path.join(ROOT, 'source', '_data', 'chuni_credits.json');
const OUT_PERIODS = path.join(ROOT, 'source', '_data', 'chuni_periods.json');
const REPORT_DIR = path.join(ROOT, '_tmp', 'reports');

const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8'));

const CREDIT_RE =
  /^((?:作詞|作曲|編曲|作編曲|歌唱|歌詞|使用VOCALOID|ギター|ベース|ドラム|ピアノ|バイオリン|演奏)(?:[・\/、](?:作詞|作曲|編曲|作編曲|歌唱|歌詞|ギター|ベース|ドラム|ピアノ|バイオリン))*)[:：]\s*(.+)$/;
const DATE_START = /^\d{4}\/\d{1,2}\/\d{1,2}/;

const credits = {};
const periods = {};
const unlockGap = [];

for (const [key, value] of Object.entries(extra)) {
  if (!value || typeof value.wiki_jp !== 'string') continue;
  const lines = value.wiki_jp.split('\n').map((s) => s.trim());

  const list = [];
  for (const line of lines) {
    const m = line.match(CREDIT_RE);
    if (m) list.push(`${m[1]}：${m[2].trim()}`);
  }
  if (list.length) credits[key] = [...new Set(list)];

  const info = value.wiki_info || {};
  const unlockKey = Object.keys(info).find((k) => /解禁|配信/.test(k));
  const unlockText = unlockKey ? String(info[unlockKey]).trim() : '';
  if (DATE_START.test(unlockText) || /\d{4}\/\d{1,2}\/\d{1,2}/.test(unlockText)) continue;
  const line = lines.slice(0, 30).find((l) => DATE_START.test(l) && /(配信|解禁|追加)/.test(l));
  if (line) {
    periods[key] = line.slice(0, 140);
    unlockGap.push([key, line.slice(0, 140)]);
  }
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(OUT_CREDITS, JSON.stringify(credits));
fs.writeFileSync(OUT_PERIODS, JSON.stringify(periods));
fs.writeFileSync(
  path.join(REPORT_DIR, 'wiki-unlock-gap.tsv'),
  ['key\tline', ...unlockGap.map(([k, l]) => `${k}\t${l}`)].join('\n'),
  'utf8'
);
console.log(`credits: ${Object.keys(credits).length}`);
console.log(`periods (解锁方式无日期、wiki 有日期): ${Object.keys(periods).length}`);
