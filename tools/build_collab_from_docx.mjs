// 从「谱师学ep0.5 - 谱面列表.docx」重建合作数据（带难度标记 红/紫/黑/黄/绿）
import fs from 'node:fs';

const PARAS = JSON.parse(fs.readFileSync('_tmp/build/docx-paras.json', 'utf8'));
const SITE = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8')).songs
  .concat(JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8')));

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '');

const COLOR = { 绿: 'b', 黄: 'a', 红: 'e', 紫: 'm', 黑: 'u' };
const DIFF_NAME = { b: 'BASIC', a: 'ADVANCED', e: 'EXPERT', m: 'MASTER', u: 'ULTIMA' };

// 别名表（朋友数据 + 项目补充）
const friend = JSON.parse(fs.readFileSync('D:/QQ/Downloads/songs.min.json', 'utf8'));
const extra = JSON.parse(fs.readFileSync('tools/designer-alias-extra.json', 'utf8').replace(/^\uFEFF/, ''));
const alias = new Map();
for (const d of friend.designers || []) {
  alias.set(norm(d.name), d.name);
  for (const a of d.aliases || []) alias.set(norm(a), d.name);
}
for (const [a, b] of Object.entries(extra)) alias.set(norm(a), b);

// 站内曲名索引
const byNorm = new Map();
for (const s of SITE) {
  byNorm.set(norm(s.title), s);
  byNorm.set(norm(String(s.title).replace(/[（(][^（）()]*[)）]$/, '')), s);
}

const SPLIT = /\s*(?:vs\.?|VS\.?|&|＆|＋|\+|／|\/|×|××|and|supported by|fused with|feat\.?|with)\s*/i;

const out = {};
let lines = 0;
let matched = 0;
const unmatched = [];

for (const raw of PARAS) {
  if (!raw || !raw.includes(' - ')) continue;
  lines++;
  const idx = raw.indexOf(' - ');
  let title = raw.slice(0, idx).trim();
  const credit = raw.slice(idx + 3).trim();
  if (!credit) continue;

  // 难度标记：标题末尾 红/紫/黑/黄/绿
  let diff = '';
  const m = title.match(/^(.*?)([绿黄红紫黑])$/);
  if (m) {
    title = m[1].trim();
    diff = COLOR[m[2]];
  }

  const key = norm(title);
  let song = byNorm.get(key);
  if (!song) {
    // 宽松：站内曲名包含
    for (const [k, v] of byNorm) {
      if (k.length > 4 && (k.includes(key) || key.includes(k))) { song = v; break; }
    }
  }
  if (!song) { unmatched.push(raw.slice(0, 40)); continue; }
  matched++;

  // 拆参与人
  const parts = credit.split(SPLIT).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) continue;
  const people = parts.map((p) => alias.get(norm(p)) || p);

  const t = String(song.title).trim();
  if (!out[t]) out[t] = {};
  const d = diff || '';
  if (!out[t][d]) out[t][d] = [];
  for (const p of people) if (!out[t][d].includes(p)) out[t][d].push(p);
}

fs.writeFileSync('_tmp/build/collab-from-docx.json', JSON.stringify(out, null, 1), 'utf8');
const songs = Object.keys(out).length;
const charts = Object.values(out).reduce((a, r) => a + Object.keys(r).length, 0);
console.log('带署名的行:', lines, '| 曲名匹配上:', matched, '| 合作曲:', songs, '| 难度条目:', charts);
console.log('未匹配样本:', unmatched.slice(0, 8).join(' | '));
