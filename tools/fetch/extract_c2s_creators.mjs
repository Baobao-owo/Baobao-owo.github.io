// 从 option 目录的 c2s 提取谱师署名（按 musicId + 难度）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'D:/QQ/Downloads/option (1)';
const DIFF = { '00': 'basic', '01': 'advanced', '02': 'expert', '03': 'master', '04': 'ultima' };

const out = {};
let files = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.c2s$/i.test(entry.name)) parse(full);
  }
}

function parse(file) {
  files++;
  const m = file.replace(/\\/g, '/').match(/music(\d{4,5})\/(\d{4,5})_(\d\d)\.c2s$/i);
  if (!m) return;
  const id = Number(m[1]);
  const diff = DIFF[m[3]];
  if (!diff) return;
  const text = fs.readFileSync(file, 'utf8');
  const line = text.split(/\r?\n/).find((l) => l.startsWith('CREATOR\t'));
  if (!line) return;
  const creator = line.split('\t')[1] ? line.split('\t')[1].trim() : '';
  if (!out[id]) out[id] = {};
  // 同一 ID 可能有多份（不同版本），难度只取第一次非空
  if (!out[id][diff] || !out[id][diff]) out[id][diff] = creator;
}

walk(ROOT);
fs.writeFileSync('_tmp/build/c2s-creators.json', JSON.stringify(out, null, 0), 'utf8');
const songs = Object.keys(out).length;
let charts = 0;
for (const id of Object.keys(out)) charts += Object.keys(out[id]).length;
console.log('c2s 文件:', files, '| musicId:', songs, '| 难度条目:', charts);
