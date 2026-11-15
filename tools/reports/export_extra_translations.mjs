// 导出「称号条件」和「ND 名义/由来」的待翻译文本
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

const titles = [];
const origins = [];
for (const [k, e] of Object.entries(extra)) {
  if (e.titles && e.titles.length > 1) {
    const lines = e.titles.slice(1).map((r) => r.map((c) => String(c || '').trim()).join('\t'));
    if (lines.length) titles.push({ k, t: lines.join('\n') });
  }
  if (e.origins && e.origins.length) {
    origins.push({ k, t: e.origins.map((s) => String(s).replace(/\t/g, ' ').trim()).filter(Boolean).join('\n') });
  }
}

fs.writeFileSync(ROOT + '/_tmp/extra-titles.json', JSON.stringify(titles), 'utf8');
fs.writeFileSync(ROOT + '/_tmp/extra-origins.json', JSON.stringify(origins), 'utf8');
console.log('称号待译:', titles.length, '| 由来待译:', origins.length);
