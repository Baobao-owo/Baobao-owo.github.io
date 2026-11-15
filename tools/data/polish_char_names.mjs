// 用角色名对照润色：把 wiki_comment 里能确认边界的日文角色名换成站内译名
// 输出 _tmp/char-pending.json（待用替换后的日文重新机翻的条目）
import fs from 'node:fs';

const map = JSON.parse(fs.readFileSync('_tmp/char-map.json', 'utf8'));
const names = Object.keys(map).sort((a, b) => b.length - a.length);
const KANA = /[\u30A0-\u30FF\u3040-\u309F\u30FC]/;

const extra = JSON.parse(fs.readFileSync('source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

function replaceNames(ja) {
  let out = ja;
  const used = [];
  for (const name of names) {
    if (name.length < 3) continue;
    let idx = out.indexOf(name);
    while (idx !== -1) {
      const before = idx > 0 ? out[idx - 1] : '';
      const after = idx + name.length < out.length ? out[idx + name.length] : '';
      // 前后不能还是日文假名，避免把 ナイ 命中到 ナイト 里
      if (!KANA.test(before) && !KANA.test(after)) {
        out = out.slice(0, idx) + map[name] + out.slice(idx + name.length);
        used.push(name);
        break;
      }
      idx = out.indexOf(name, idx + 1);
    }
  }
  return { text: out, used };
}

const pending = [];
for (const [k, e] of Object.entries(extra)) {
  const ja = e.wiki_comment || '';
  if (!ja) continue;
  const { text, used } = replaceNames(ja);
  if (!used.length) continue;
  pending.push({ k, t: text.slice(0, 4500), used });
}

fs.writeFileSync('_tmp/char-pending.json', JSON.stringify(pending), 'utf8');
fs.writeFileSync('_tmp/char-used.json', JSON.stringify(pending.map((p) => ({ k: p.k, used: p.used })), null, 1), 'utf8');
console.log('需要重译的条目:', pending.length);
pending.slice(0, 5).forEach((p) => console.log(p.k, '::', p.used.join(',')));
