// 用曲目页「譜面作者」校准 collab.json：
//   1) 以提交版为底（避免之前被原始梗名覆盖掉已解析的人）
//   2) 署名里能认出的谱师做「并集」补进去
//   3) 有分工表的曲目，用分工表名单覆盖那张谱
import fs from 'node:fs';

const norm = (s) => String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const squash = (s) => String(s || '').replace(/[\s\u3000]+/g, '').toLowerCase();

const COLLAB = 'source/assets/data/collab.json';
const base = JSON.parse(fs.readFileSync('_tmp/collab.head.json', 'utf8'));
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const designers = JSON.parse(fs.readFileSync('source/assets/data/designers.json', 'utf8'));
const credits = JSON.parse(fs.readFileSync('_tmp/wiki/song-credits.json', 'utf8'));
const parts = JSON.parse(fs.readFileSync('source/_data/collab_parts.json', 'utf8'));

const alias2who = new Map();
for (const d of friend.designers || []) {
  alias2who.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias2who.set(norm(a), d.name);
}
const aliasSquashed = new Map();
for (const [k, who] of alias2who) aliasSquashed.set(squash(k), who);
const prim = (designers.designers || []).filter((d) => !d.pseudo).map((d) => d.name);
for (const n of prim) aliasSquashed.set(squash(n), n);

function resolve(name) {
  const raw = String(name || '').replace(/\*\s*\d*\s*$/, '').trim();
  if (!raw) return '';
  const direct = alias2who.get(norm(raw)) || aliasSquashed.get(squash(raw));
  if (direct) return direct;
  const t = squash(raw);
  if (t.length >= 3) {
    const suffix = prim.filter((n) => squash(n).endsWith(t));
    if (suffix.length === 1) return suffix[0];
    const inc = prim.filter((n) => squash(n).includes(t));
    if (inc.length === 1) return inc[0];
  }
  return '';
}

const SPLIT = /\s*(?:vs\.?|VS\.?|Vs\.?|＆|&|\+|＋|×|✕|と|with|meets|supported by|fumbled by|fused with|feat\.?|by)\s*/i;

function peopleOf(credit) {
  const tokens = String(credit || '')
    .replace(/【[^】]*】/g, '')
    .split(SPLIT)
    .map((x) => x.replace(/[（(][^）)]*[）)]/g, '').trim())
    .filter(Boolean);
  const out = [];
  for (const t of tokens) {
    const who = resolve(t);
    if (who && !out.includes(who)) out.push(who);
  }
  return out;
}

function keyOf(title) {
  const n = norm(title);
  return Object.keys(base.songs).find((k) => norm(k) === n) || null;
}

let added = 0;
let filled = 0;
let removed = 0;
for (const [title, entry] of Object.entries(credits)) {
  const key = keyOf(title);
  if (!key) continue;
  for (const [diff, credit] of Object.entries(entry)) {
    if (diff === 'b' || diff === 'a') continue;
    const people = peopleOf(credit);
    const tgt = base.songs[key] || (base.songs[key] = {});
    const cur = tgt[diff] || [];
    if (people.length >= 2) {
      // 署名确认是合作：以 wiki 为准
      if (JSON.stringify(cur) !== JSON.stringify(people)) {
        tgt[diff] = people;
        filled++;
      }
    } else if (people.length === 1 && !SPLIT.test(String(credit)) && !cur.includes(people[0])) {
      // 署名只有一个人 → 这张谱不是合作，删掉旧的合作记录
      if (cur.length) {
        delete tgt[diff];
        removed++;
      }
    } else if (people.length === 1 && !SPLIT.test(String(credit)) && cur.length) {
      // 签名的人和已有的对得上，但列表里还有别人（旧错误数据）→ 收缩成单人
      delete tgt[diff];
      removed++;
    }
  }
}

// 分工表最终覆盖（比署名更细，13 人这种）
for (const entry of Object.values(parts)) {
  const key = keyOf(entry.title);
  if (!key) continue;
  const tgt = base.songs[key] || (base.songs[key] = {});
  const diff = Object.keys(tgt).sort((a, b) => (tgt[b] || []).length - (tgt[a] || []).length)[0] || 'm';
  const people = [];
  for (const row of entry.rows) {
    const cell = row[row.length - 1];
    const names = [String(cell).replace(/[（(][^）)]*[）)]/g, '').trim()];
    for (const m of String(cell).matchAll(/[（(]([^）)]*)[）)]/g)) {
      const inner = m[1].replace(/^(配置代理|代理|監修|協力)[:：]\s*/, '').trim();
      if (inner) names.push(inner);
    }
    for (const n of names) {
      const who = resolve(n) || n;
      if (who && !people.includes(who)) people.push(who);
    }
  }
  if (people.length >= 2) tgt[diff] = people;
}

fs.writeFileSync(COLLAB, JSON.stringify(base, null, 0), 'utf8');
console.log('新增参与者条目:', added, ' 新建难度条目:', filled, ' 合作曲:', Object.keys(base.songs).length);
