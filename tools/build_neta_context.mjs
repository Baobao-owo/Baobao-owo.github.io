// 为翻译准备背景上下文：清洗介绍、汇总称号/由来、标注可疑 neta 与外文引用
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_extra.json'), 'utf8').replace(/^\uFEFF/, ''));
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));

const JUNK = [/^情報/, /Font Awesome/, /^--+>?$/, /^-->$/, /^ゲーム「/, /^【?基本情報】?$/];

function cleanLines(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !JUNK.some((re) => re.test(l)));
}

// 常见作品/系列（用于提示翻译时统一官方译名）
const FRANCHISES = [
  { key: 'ブルーアーカイブ|Blue Archive', zh: '蔚蓝档案' },
  { key: 'VOCALOID|初音ミク|ボーカロイド', zh: 'VOCALOID / 初音未来' },
  { key: '東方Project|東方', zh: '东方Project' },
  { key: 'アイドルマスター|デレマス|ミリオン|シャニマス|学園アイドルマスター', zh: '偶像大师系列' },
  { key: 'ウマ娘', zh: '赛马娘' },
  { key: 'ラブライブ|スクールアイドル', zh: 'LoveLive! 系列' },
  { key: 'プロジェクトセカイ|セカイ', zh: '世界计划（Project SEKAI）' },
  { key: 'プリコネ|プリンセスコネクト', zh: '公主连结 Re:Dive' },
  { key: 'アークナイツ', zh: '明日方舟' },
  { key: '原神|Genshin', zh: '原神' },
  { key: 'Arcaea', zh: 'Arcaea' },
  { key: 'maimai', zh: 'maimai' },
  { key: 'オンゲキ', zh: '音击（ONGEKI）' },
  { key: 'SDVX|SOUND VOLTEX', zh: 'SOUND VOLTEX' },
  { key: 'イロドリミドリ', zh: '彩绿（イロドリミドリ）' },
  { key: 'ゲキマイ|ゲキチュウマイ', zh: 'GEKICHUMAI（ゲキチュウマイ）' },
  { key: 'ボカロP|wowaka|ヒトリエ', zh: 'VOCALOID P / wowaka（ヒトリエ）' }
];

function franchiseHints(text) {
  const hits = [];
  for (const f of FRANCHISES) {
    if (new RegExp(f.key, 'i').test(text)) hits.push(f.zh);
  }
  return [...new Set(hits)];
}

// 简单 neta 线索：引号句、书名号、英文短语
function netaHints(text) {
  const out = new Set();
  for (const m of String(text).matchAll(/[「『]([^」』]{2,40})[」』]/g)) out.add(m[1]);
  for (const m of String(text).matchAll(/[A-Za-z][A-Za-z0-9'’\- ]{3,40}/g)) {
    const s = m[0].trim();
    if (s.length > 3) out.add(s);
  }
  return [...out].slice(0, 20);
}

const out = {};
for (const [title, e] of Object.entries(extra)) {
  const introLines = cleanLines(e.wiki_comment);
  const origins = (e.origins || []).map((s) => String(s).trim()).filter(Boolean);
  const titles = (e.titles || []).slice(1).map((r) => [String(r[0] || '').trim(), String(r[1] || '').trim()]);
  if (!introLines.length && !origins.length && !titles.length) continue;

  const blob = introLines.join('\n') + '\n' + origins.join('\n') + '\n' + titles.map((r) => r.join(' ')).join('\n');
  out[title] = {
    intro: introLines,
    origins,
    titles,
    franchises: franchiseHints(blob),
    netaHints: netaHints(blob)
  };
}

const file = path.join(ROOT, '_tmp/neta-context.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1), 'utf8');
console.log('上下文曲目:', Object.keys(out).length);
for (const t of ['アンクローズ・ヒューマン', 'RE Aoharu']) {
  console.log('---', t, JSON.stringify(out[t], null, 1).slice(0, 600));
}
