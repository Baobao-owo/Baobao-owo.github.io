// 只保留白名单里的曲目（避免批量抓取时把内容一次性全放出去）
// 白名单写在 source/_data/chuni_config.yml 的 wiki_only
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
const configPath = path.join(ROOT, 'source/_data/chuni_config.yml');
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));

let allow = [];
const cfgText = fs.readFileSync(configPath, 'utf8');
const m = cfgText.match(/wiki_only:\s*\n((?:\s+-\s+.*\n)+)/);
if (m) {
  allow = m[1]
    .split('\n')
    .map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

if (!allow.length) {
  console.log('wiki_only 为空，跳过（不修改）');
  process.exit(0);
}

const kept = {};
const stash = {};
for (const k of Object.keys(extra)) {
  if (allow.indexOf(k) !== -1) kept[k] = extra[k];
  else stash[k] = extra[k];
}

if (Object.keys(stash).length) {
  fs.mkdirSync(path.join(ROOT, '_tmp'), { recursive: true });
  const stashPath = path.join(ROOT, '_tmp/chuni_extra_stash.json');
  let old = {};
  try {
    old = JSON.parse(fs.readFileSync(stashPath, 'utf8'));
  } catch (e) {}
  Object.assign(old, stash);
  fs.writeFileSync(stashPath, JSON.stringify(old, null, 1), 'utf8');
}

fs.writeFileSync(extraPath, JSON.stringify(kept, null, 1), 'utf8');
console.log('保留:', Object.keys(kept).join(', ') || '(无)', '| 收进暂存:', Object.keys(stash).length);
