import fs from 'node:fs';

const found = JSON.parse(fs.readFileSync('_tmp/build/split-aliases.json', 'utf8'));
const extraPath = 'tools/designer-alias-extra.json';
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8').replace(/^\uFEFF/, ''));

let added = 0;
for (const f of found) {
  if (!f.who) continue;
  // 两边解析到同一人时，只留一个名字
  const names = [...new Set(f.resolved)];
  const who = names.join(' × ');
  if (!extra[f.raw]) {
    extra[f.raw] = who;
    added++;
  }
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 2) + '\n', 'utf8');
console.log('新增联名别名:', added, '| 总条目:', Object.keys(extra).length);
