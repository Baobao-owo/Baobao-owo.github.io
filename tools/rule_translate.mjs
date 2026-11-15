// 规则化翻译介绍中的结构化行；遇到无法完全匹配的曲目则跳过（留待手翻）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXTRA = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));

const done = new Set();
for (const f of fs.readdirSync('_tmp').filter((x) => /^batch\d+-.*\.json$/.test(x))) {
  try {
    for (const s of JSON.parse(fs.readFileSync(path.join('_tmp', f), 'utf8'))) done.add(s.song);
  } catch (e) {}
}

const num = (s) => String(s).replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));

const RULES = [
  [/^(\d{4}\/\d{1,2}\/\d{1,2})\s*追加$/, (m) => `${m[1]} 追加`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})\s*追加[（(]楽曲と同時追加[)）]$/, (m) => `${m[1]} 追加（与乐曲同步追加）`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})追加、\s*(.+?)マップ([0-9０-９]+)元課題曲。$/, (m) => `${m[1]} 追加，${m[2]}地图 ${num(m[3])} 的原课题曲。`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})追加、\s*(.+?)エリア([0-9０-９]+)元課題曲。$/, (m) => `${m[1]} 追加，${m[2]}区域 ${num(m[3])} 的原课题曲。`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})～(\d{4}\/\d{1,2}\/\d{1,2})\s*イベント「(.+?)」先行配信曲。$/, (m) => `${m[1]}～${m[2]} 活动「${m[3]}」先行配信曲。`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})～(\d{4}\/\d{1,2}\/\d{1,2})\s*(.+?)イベント「(.+?)」先行配信曲。$/, (m) => `${m[1]}～${m[2]} ${m[3]}活动「${m[4]}」先行配信曲。`],
  [/^(\d{4}年\d{1,2}月\d{1,2}日)\s*投稿。$/, (m) => `${m[1]}投稿。`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})\s*第(\d+)回ロケテスト先行収録$/, (m) => `${m[1]} 第 ${m[2]} 回场测先行收录`],

  [/^対応キャラ\s+(.+)$/, (m) => `对应角色：${m[1].trim()}`],
  [/^ロシェガメの洞窟イベント\s*([A-Za-z0-9]+)F?の課題曲に指定されていた。$/, (m) => `曾被指定为ロシェガメ洞窟活动 ${m[1]}F 的课题曲。`],
  [/^ロシェの宝物庫[(（](.+?)[)）]の進行度(\d+)の課題曲に指定されていた。$/, (m) => `曾被指定为ロシェ宝物库（${m[1]}）进度 ${m[2]} 的课题曲。`],
  [/^「(.+?)」テーマソング。$/, (m) => `《${m[1]}》主题曲。`],
  [/^(.+?)に移植されている。$/, (m) => `已移植到 ${m[1]}。`],
  [/^音楽ゲーム「(.+?)」オリジナル楽曲の一つ。$/, (m) => `音乐游戏《${m[1]}》的原创曲之一。`],
  [/^(.+?)のアルバム「(.+?)」収録曲。$/, (m) => `${m[1]} 的专辑《${m[2]}》收录曲。`],
  [/^ゲーム「(.+?)」(OP|ED|挿入)曲。$/, (m) => `游戏《${m[1]}》${{ OP: 'OP', ED: 'ED', 挿入: '插入' }[m[2]]} 曲。`],

  [/^使用VOCALOID[：:]\s*(.+)$/, (m) => `使用 VOCALOID：${m[1].trim()}`],
  [/^使用VOCAROID[：:]\s*(.+)$/, (m) => `使用 VOCALOID：${m[1].trim()}`],
  [/^使用音声ライブラリ[：:]\s*(.+)$/, (m) => `使用音声库：${m[1].trim()}`],
  [/^使用音源ライブラリ[：:]\s*(.+)$/, (m) => `使用音源库：${m[1].trim()}`],
  [/^ボーカル[：:]\s*(.+)$/, (m) => `演唱：${m[1].trim()}`],
  [/^歌唱[：:]\s*(.+)$/, (m) => `演唱：${m[1].trim()}`],
  [/^歌[：:]\s*(.+)$/, (m) => `演唱：${m[1].trim()}`],
  [/^エンジニア[：:]\s*(.+)$/, (m) => `工程师：${m[1].trim()}`],
  [/^作詞[：:]\s*(.+)$/, (m) => `作词：${m[1].trim()}`],
  [/^作曲[：:]\s*(.+)$/, (m) => `作曲：${m[1].trim()}`],
  [/^編曲[：:]\s*(.+)$/, (m) => `编曲：${m[1].trim()}`],
  [/^作詞[・\/]作曲[：:]\s*(.+)$/, (m) => `作词・作曲：${m[1].trim()}`],
  [/^作曲[・\/]編曲[：:]\s*(.+)$/, (m) => `作曲・编曲：${m[1].trim()}`],
  [/^作詞[・\/]作編曲[：:]\s*(.+)$/, (m) => `作词・作编曲：${m[1].trim()}`],
  [/^作詞\/作曲\/編曲[：:]\s*(.+)$/, (m) => `作词/作曲/编曲：${m[1].trim()}`],
  [/^作詞／作曲／編曲[：:]\s*(.+)$/, (m) => `作词／作曲／编曲：${m[1].trim()}`],
  [/^作詞・作曲・編曲[：:]\s*(.+)$/, (m) => `作词・作曲・编曲：${m[1].trim()}`],
  [/^作編曲[：:]\s*(.+)$/, (m) => `作编曲：${m[1].trim()}`],
  [/^ジャンルは(.+?)。$/, (m) => `曲风是 ${m[1]}。`],

  [/^アルバム「(.+?)」収録曲。$/, (m) => `收录于专辑《${m[1]}》。`],
  [/^アルバム「(.+?)」収録。$/, (m) => `收录于专辑《${m[1]}》。`],
  [/^アニメ「(.+?)」(OP|ED|挿入)曲。$/, (m) => `动画《${m[1]}》${{ OP: 'OP', ED: 'ED', 挿入: '插入' }[m[2]]} 曲。`],
  [/^アニメ「(.+?)」オープニングテーマ。$/, (m) => `动画《${m[1]}》片头主题曲。`],
  [/^アニメ「(.+?)」エンディングテーマ。$/, (m) => `动画《${m[1]}》片尾主题曲。`],
  [/^「(.+?)」収録楽曲。$/, (m) => `收录于《${m[1]}》。`],
  [/^(\d{4}年\d{1,2}月\d{1,2}日)投稿。(\d{4}年\d{1,2}月\d{1,2}日)ミリオン達成。$/, (m) => `${m[1]}投稿，${m[2]}达成百万播放。`],
  [/^(\d{4}\/\d{1,2}\/\d{1,2})～(\d{1,2}\/\d{1,2})\s*(.+?)先行配信楽曲$/, (m) => `${m[1]}～${m[2]} ${m[3]}先行配信曲`],
  [/^BMSイベント「(.+?)」出展楽曲。$/, (m) => `BMS 活动「${m[1]}」参展曲。`],
  [/^(.+?)の(\d+)作目。$/, (m) => `${m[1]} 的第 ${m[2]} 作。`]
];

function tr(line) {
  for (const [re, fn] of RULES) {
    const m = line.match(re);
    if (m) return fn(m);
  }
  // 元前/元次 课题曲行
  let m3 = line.match(/^(.+?)\s+(元前|前)(マップ)?課題曲\s*\/\s*(元次|次)(マップ)?課題曲$/);
  if (m3) return `${m3[1]} ${m3[2]}课题曲 / ${m3[4]}课题曲`;
  m3 = line.match(/^(.+?)\s+(元前|前)(マップ)?課題曲$/);
  if (m3) return `${m3[1]} ${m3[2]}课题曲`;
  m3 = line.match(/^(.+?)\s+(元次|次)(マップ)?課題曲$/);
  if (m3) return `${m3[1]} ${m3[2]}课题曲`;
  if (/^アーティストコメント$/.test(line)) return '作者留言';
  if (/^動画説明文$/.test(line)) return '视频简介';
  if (/^採用コメント$/.test(line)) return '入选留言';
  return null;
}

const results = [];
const skipped = [];
for (const [title, x] of Object.entries(extra)) {
  if (done.has(title)) continue;
  if (title.startsWith('(WE)')) continue;
  const rawLines = String(x.wiki_comment || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/Font Awesome|^情報|^-->$/.test(l));
  if (!rawLines.length) continue;
  const out = [];
  let ok = true;
  for (const line of rawLines) {
    if (line.startsWith('もしかして')) continue;
    if (/^※/.test(line)) {
      ok = false;
      break;
    }
    const zh = tr(line);
    if (!zh) {
      ok = false;
      break;
    }
    out.push(zh);
  }
  if (!ok || !out.length) {
    skipped.push(title);
    continue;
  }
  results.push({ song: title, zh: out.join('\n'), lines: out.length });
}

fs.writeFileSync(path.join(ROOT, '_tmp/rule-translated.json'), JSON.stringify(results, null, 1), 'utf8');
fs.writeFileSync(path.join(ROOT, '_tmp/rule-skipped.json'), JSON.stringify(skipped, null, 1), 'utf8');
console.log('可规则翻译:', results.length, '| 跳过:', skipped.length);
