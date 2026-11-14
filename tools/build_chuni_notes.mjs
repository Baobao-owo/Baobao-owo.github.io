// 把会报评论匹配到站内曲目，产出 source/_data/chuni_notes.json
import fs from 'node:fs';

const norm = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】＜＞《》〈〉○●◇◆■□☆★()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&]/g, '');

// 去掉曲名后面的读音说明，例如「]-[|/34<#!(ヒバチ)」
const bareTitle = (t) => String(t || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();

const recs = JSON.parse(fs.readFileSync('_tmp/wiki/note_records.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const index = new Map(); // norm(title) -> 站内 title
// 站内曲名常带「(TV edit)」「（104期Ver.）」这类后缀，去掉后的写法也登记一份
for (const s of site.songs) {
  index.set(norm(s.title), s.title);
  const bare = norm(bareTitle(s.title));
  if (bare && !index.has(bare)) index.set(bare, s.title);
}
for (const s of removed) {
  if (!index.has(norm(s.title))) index.set(norm(s.title), s.title);
  const bare = norm(bareTitle(s.title));
  if (bare && !index.has(bare)) index.set(bare, s.title);
}

// 常见术语统一（只做明显错译）
const TERM_FIX = [
  [/诺兹|诺特|音符/g, 'note'],
  [/谱面师|制谱师/g, '谱师'],
  [/分数值|定数值/g, '定数'],
];

// 合并多余空行：原文里每段之间常夹空行，直接 pre-wrap 会拉出大片空白
function tidy(text) {
  return String(text || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

// 「Techno Kitchen（嘉宾）Techno Kitchen（ゲスト）」这种重复写法，只留前半段
function cleanDesigner(name) {
  const t = String(name || '').trim();
  const m = t.match(/^(.+?)（([^）]*)）(.+)$/);
  if (m && m[3].startsWith(m[1].trim())) return m[1].trim() + '（' + m[2] + '）';
  return t;
}

function fixZh(text) {
  let t = tidy(text);
  for (const [re, to] of TERM_FIX) t = t.replace(re, to);
  return t.trim();
}

function bigrams(s) {
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

function dice(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
}

const unmatchedRows = [];
const PAGE_SLUG = {
  '11 周年会报': 'chunithm-11th-report',
  '10 周年会报': 'chunithm-10th-report',
  '9 周年会报': 'chunithm-9th-report',
  '8 周年会报': 'chunithm-8th-report',
  '7 周年会报': 'chunithm-7th-report',
  '企鹅秘话 第 6 话': 'chunithm-penguin-secret-6',
  '企鹅秘话 第 5 话': 'chunithm-penguin-secret-5',
  '企鹅秘话 第 4 话': 'chunithm-penguin-secret-4',
  '企鹅秘话 第 3 话': 'chunithm-penguin-secret-3',
  '企鹅秘话 第 2 话': 'chunithm-penguin-secret-2',
  '企鹅秘话 第 1 话': 'chunithm-penguin-secret-1',
};
const fuzzy = [];
// 会报里写法不同、但确实就是站内某首歌的手动对应（用户确认：直接贴过去就行）
const MANUAL_MAP = {
  '僕たちのギャグマンガ日和': '僕達のギャグマンガ日和',
  '愛包ダンスホール (MASTER)': '愛包ダンスホール',
  'Not On the Sideline': 'Not On The Sidelines - Street Fighter 6 Main Theme',
  'トウキョウ・シャンディ・ランデヴ': 'トウキョウ・シャンディ・ランデヴ feat. 花譜, ツミキ',
  '《MALKUTH -The Last Ruler of Terrestrials-》《DA\u2019AT -The First Seeker of Souls-》': 'MALKUTH -The Last Ruler of Terrestrials-',
  '多重未来のカルテット': '多重未来のカルテット -Quartet Theme-',
  'ENDYMION(EXPERT)': 'ENDYMION',
  '巫女みこナース（EXP）': '巫女みこナース・愛のテーマ',
  'Your Affection': 'Your Affection(Daisuke Asakura Remix)',
  '・盟月【MASTER】': '盟月',
  '新時代': '新時代（ウタfrom ONE PIECE FILM RED）',
  'WAVE［割］': 'WAVE',
  '秘神マターラ feat.魂音泉［布］': '【東方ニコカラ】秘神マターラ feat.魂音泉【IOSYS】',
  'AIR［狂］': 'Air',
};
// 明确属于隔壁音击（ONGEKI）、不挂到中二曲目上
const SKIP_TITLES = new Set([
  'Dynamite', 'I Love It', 'I Really Like You', 'I Will Survive（Eric Kupper Mix Extended）',
  'Runaway（U&I）', 'Permission to Dance', 'Trinity Departure', 'Saika', 'Deep-Connect',
  'ヴァルマシアゴースト', 'Prominence（オンゲキ）',
]);
const out = {};
let matched = 0;
const unmatched = new Set();

// 括号里是难度、(vs 谱师)、名义说明时才去掉；像「-[i]3-」这种是曲名本身，不能动
function stripNotes(s) {
  return String(s || '').replace(/[【（(［\[][^】）)］\]]*[】）)］\]]/g, (m) => {
    const inner = m.slice(1, -1).trim();
    if (/^(BASIC|ADVANCED|EXPERT|MASTER|ULTIMA|WORLD'?S END)$/i.test(inner)) return '';
    if (/^vs[\s\u3000]/i.test(inner)) return '';
    if (/名义|名義/.test(inner)) return '';
    return m;
  });
}

// 会报里的标题常带装饰：＜曲名＞、《曲名》、○曲名、・曲名，或「曲名 (MASTER) / 另一首」
function candidates(title) {
  const out = [];
  const push = (t) => {
    let v = bareTitle(String(t || '').trim());
    v = v.replace(/^[＜<《「【\[（(・○●◆◇■□☆★▼▽※\s]+/, '').replace(/[＞>》」】\]）)・\s]+$/, '');
    v = bareTitle(v.trim()).trim();
    if (v && !out.includes(v)) out.push(v);
  };
  const base = String(title || '').trim();
  const noNotes = stripNotes(base);
  push(base);
  push(noNotes);
  push(base.replace(/\b(BASIC|ADVANCED|EXPERT|MASTER|ULTIMA)\b/gi, ''));
  push(noNotes.replace(/\b(BASIC|ADVANCED|EXPERT|MASTER|ULTIMA)\b/gi, ''));
  String(base).split(/[／/]/).forEach(push);
  String(noNotes).split(/[／/]/).forEach(push);
  return out;
}

for (const r of recs) {
  if (!r.title) continue;
  if (SKIP_TITLES.has(String(r.title).trim())) {
    unmatched.add(r.title);
    continue;
  }
  let song = null;
  const manual = MANUAL_MAP[String(r.title).trim()];
  if (manual) song = index.get(norm(manual)) || null;
  for (const c of (song ? [] : candidates(r.title))) {
    const hit = index.get(norm(c));
    if (hit) { song = hit; break; }
  }
  if (!song) {
    const key = norm(r.title);
    let best = null;
    let bestScore = 0;
    for (const [k, t] of index) {
      const sc = dice(key, k);
      if (sc > bestScore) { bestScore = sc; best = t; }
    }
    if (best && bestScore >= 0.86) {
      song = best;
      fuzzy.push({ title: r.title, matched: best, score: Number(bestScore.toFixed(2)), round: r.round });
    }
  }
  if (!song) {
    unmatched.add(r.title);
    unmatchedRows.push({
      round: r.round,
      src: 'https://note-report.pages.dev/' + (PAGE_SLUG[r.round] || ''),
      designer: r.designer || '',
      diff: r.diff || '',
      title: r.title,
      jp: String(r.jp || '').split('\n')[0].slice(0, 160),
      zh: String(r.zh || '').split('\n')[0].slice(0, 160),
      kind: (/^(前言|结尾|后记|关于|数据|Lineup|阵容|致辞|贺词|祝|引言|序|附录|乐曲公募)/.test(r.title) || !r.diff) ? '疑似小标题/非曲目' : '疑似歌曲（站内没有）',
    });
    continue;
  }
  const item = {
    r: r.round,
    d: cleanDesigner(r.designer),
    df: r.diff || '',
    jp: tidy(r.jp),
    zh: fixZh(r.zh),
  };
  if (!item.jp && !item.zh) continue;
  if (!out[song]) out[song] = [];
  // 去重（同页同谱师同难度同曲）
  const dup = out[song].some((x) => x.r === item.r && x.d === item.d && x.df === item.df);
  if (!dup) out[song].push(item);
  matched++;
}

fs.writeFileSync('source/_data/chuni_notes.json', JSON.stringify(out, null, 0), 'utf8');
fs.writeFileSync('_tmp/build/unmatched-notes.json', JSON.stringify(unmatchedRows, null, 1), 'utf8');
fs.writeFileSync('_tmp/build/fuzzy-matches.json', JSON.stringify(fuzzy, null, 1), 'utf8');
const sizes = Object.values(out).map((a) => a.length);
console.log('匹配到曲目:', Object.keys(out).length, '| 条目:', matched, '| 有日文:', Object.values(out).flat().filter((x) => x.jp).length);
console.log('单曲最多条目:', Math.max(...sizes));
console.log('未匹配标题数:', unmatched.size, '| 样本:', [...unmatched].slice(0, 10).join(' | '));
