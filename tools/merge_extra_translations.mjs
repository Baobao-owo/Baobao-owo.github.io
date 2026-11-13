// 合并称号/由来翻译（支持 CRLF，按 \n 还原行，称号行再按 \t 拆列）
import fs from 'node:fs';

const ROOT = process.cwd();
const EXTRA = ROOT + '/source/_data/chuni_extra.json';
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));

function readJsonl(file) {
  const out = [];
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) continue;
    const i = line.indexOf('\t');
    if (i < 0) continue;
    out.push({ k: line.slice(0, i).trim(), zh: line.slice(i + 1).replace(/⏎/g, '\n').trim() });
  }
  return out;
}

let tCount = 0;
for (const { k, zh } of readJsonl(ROOT + '/tools/out/extra-titles-zh.jsonl')) {
  const e = extra[k];
  if (!e || !e.titles) continue;
  const head = e.titles[0];
  const rows = zh
    .split('\n')
    .map((line) => line.replace(/\r$/, '').split('\t').map((c) => c.trim()))
    .filter((r) => r.length && r[0]);
  if (!rows.length) continue;
  rows.forEach(function (r) { for (var i = 0; i < r.length; i++) { r[i] = r[i].split('危险技能启动').join('触发危险技能'); } });
  e.titles_zh = [head].concat(rows);
  tCount++;
}

let oCount = 0;
for (const { k, zh } of readJsonl(ROOT + '/tools/out/extra-origins-zh.jsonl')) {
  const e = extra[k];
  if (!e || !e.origins) continue;
  const lines = zh
    .split('\n')
    .map((s) => s.replace(/\r$/, '').replace(/^[-・]\s*/, '').trim())
    .filter(Boolean);
  if (!lines.length) continue;
  e.origins_zh = lines;
  oCount++;
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
console.log('称号已合并:', tCount, '| 由来已合并:', oCount);
