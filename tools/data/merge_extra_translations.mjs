// 合并称号/由来翻译：处理 Google 吃掉制表符的情况（按条件标志切分）
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

// 条件部分常见的开头标志
const COND_RE = /(ULTIMA|MASTER|EXPERT|ADVANCED|BASIC|SPEED|RANK|FULL\s*(CHAIN|COMBO)|ALL\s*JUSTICE|デンジャースキル|触发危险技能|店内マッチング|店内匹配|称号[「『]|キャラクター|角色[「『]|\d+\s*人|プレイ|游玩|※)/;

function splitRow(line) {
  const cells = line.split('\t').map((c) => c.trim()).filter(Boolean);
  if (cells.length >= 2) return [cells[0], cells.slice(1).join(' ')];
  const m = COND_RE.exec(line);
  if (m && m.index > 0) {
    return [line.slice(0, m.index).trim(), line.slice(m.index).trim()];
  }
  return [line.trim(), ''];
}

let tCount = 0;
for (const { k, zh } of readJsonl(ROOT + '/tools/out/extra-titles-zh.jsonl')) {
  const e = extra[k];
  if (!e || !e.titles) continue;
  const head = e.titles[0];
  const rows = zh
    .split('\n')
    .map((l) => l.replace(/\r$/, '').trim())
    .filter(Boolean)
    .map(splitRow)
    .map((r) => r.map((c) => c.split('危险技能启动').join('触发危险技能')));
  if (!rows.length) continue;
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
const sample = extra['千本桜'];
console.log('sample:', JSON.stringify(sample && sample.titles_zh));
