// 清理合作数据里脏的参与者名
import fs from 'node:fs';

const p = 'source/assets/data/collab.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
const songs = data.songs || {};

const JUNK = /(cooperated|supported by|まとめ役|再編成|監修|制作)/i;

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '');

let fixed = 0;

for (const [title, rec] of Object.entries(songs)) {
  for (const k of Object.keys(rec)) {
    let list = (rec[k] || []).map((x) => String(x).trim()).filter(Boolean);
    const before = list.slice();

    // 1) 补全被分隔符切坏的括号
    const merged = [];
    for (let i = 0; i < list.length; i++) {
      let cur = list[i];
      const open = (cur.match(/[（(]/g) || []).length;
      const close = (cur.match(/[）)]/g) || []).length;
      while (open > close && i + 1 < list.length) {
        cur += '＆' + list[++i];
        if (/[）)]/.test(list[i])) break;
      }
      merged.push(cur);
    }
    list = merged;

    // 2) 丢掉英文尾巴 / 杂项
    list = list.filter((x) => !JUNK.test(x));

    // 3) 去掉「無印：」「PLUS～：」前缀，再按规范化去重
    const seen = new Set();
    const out = [];
    for (const x of list) {
      const clean = x.replace(/^(無印|PLUS～|PLUS|LUMINOUS～)\s*[:：]\s*/, '');
      const key = norm(clean);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }

    // 4) 只剩一个人就当作非合作难度
    if (out.length < 2) {
      delete rec[k];
    } else {
      rec[k] = out;
    }
    if (JSON.stringify(before) !== JSON.stringify(rec[k] || [])) fixed++;
  }
}

data.songs = songs;
fs.writeFileSync(p, JSON.stringify(data, null, 1) + '\n', 'utf8');
console.log('清理的难度条目:', fixed, '| 合作曲:', Object.keys(songs).length);
