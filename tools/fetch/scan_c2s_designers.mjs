// 从 .c2s 谱面文件头里读 CREATOR（谱师名义）
// 输出：_tmp/game/c2s-designers.json   {"<id>_<diffIdx>": "谱师名"}
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'D:/XVX/HDD/bin/option/A300/music';
const OUT = process.argv[3] || '_tmp/game/c2s-designers.json';

function readCreator(buf) {
  const at = buf.indexOf(Buffer.from('CREATOR'));
  if (at < 0) return '';
  // 格式：CREATOR \t value \r\n
  let i = at + 'CREATOR'.length;
  if (buf[i] === 0x09) i++;
  const start = i;
  while (i < buf.length && buf[i] !== 0x0d && buf[i] !== 0x0a) i++;
  return buf.slice(start, i).toString('utf8').replace(/\u0000/g, '').trim();
}

const map = {};
let files = 0;
let withCreator = 0;
const samples = [];

(function walk(dir, depth) {
  if (depth > 3) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else {
      const m = e.name.match(/^(\d+)_(\d{2})\.c2s$/);
      if (!m) continue;
      files++;
      const buf = fs.readFileSync(p);
      const creator = readCreator(buf);
      const key = String(Number(m[1])) + '_' + String(Number(m[2]));
      if (creator) {
        withCreator++;
        if (samples.length < 5) samples.push(key + ' => ' + creator);
      }
      if (!map[key] || (!map[key] && creator)) map[key] = creator;
    }
  }
})(ROOT, 0);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(map, null, 0), 'utf8');
console.log('c2s 文件:', files, '| 有 CREATOR:', withCreator, '| key 数:', Object.keys(map).length);
samples.forEach((s) => console.log('  ' + s));
