// WE（WORLD'S END）署名线索：只记录 wiki 由来里出现的 ND 名义，不做推断归属
// 输出：tools/designer-we.json  { "<曲名>": { credit } }
//
// 说明：WE 谱师绝大多数不公开，wiki 里也只有梗名；之前尝试用别名表反推「是谁」，
// 但那是别人数据的推断、没有明确出处，已全部去掉。等以后有可靠来源再补 person。
import fs from 'node:fs';

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8'));

const RE = /ND名義\s*[（(](WE[^）)]*)[）)]\s*[「『]([^」』]+)[」』]/g;

const out = {};
let hits = 0;

for (const [title, x] of Object.entries(extra)) {
  const text = [...(x.origins || []), String(x.wiki_comment || '')].join('\n');
  if (!/WE/.test(text)) continue;
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(text))) {
    const credit = m[2].trim();
    hits++;
    if (!out[title]) out[title] = { credit };
  }
}

fs.writeFileSync('tools/designer-we.json', JSON.stringify(out, null, 1) + '\n', 'utf8');
console.log('WE 署名条目:', hits, ' 涉及曲:', Object.keys(out).length, '（只留署名，不做归属推断）');
