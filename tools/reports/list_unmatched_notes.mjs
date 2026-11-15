// 列出会报评论里没对上站内曲目的条目，产出 JSON 供生成 docx
import fs from 'node:fs';

const PAGES = {
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

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&]/g, '');

const bareTitle = (t) => String(t || '').replace(/[（(][^（）()]*[)）]\s*$/, '').trim();

function candidates(title) {
  const out = [];
  const push = (t) => {
    const v = bareTitle(String(t || '').replace(/^[＜<《「【\[（(・○●◆◇■□☆★]+/, '').replace(/[＞>》」】\]）)・]+$/, '').trim());
    if (v && !out.includes(v)) out.push(v);
  };
  push(title);
  String(title).split(/[／/]/).forEach(push);
  return out;
}

const recs = JSON.parse(fs.readFileSync('_tmp/wiki/note_records.json', 'utf8'));
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const index = new Map();
for (const s of site.songs) index.set(norm(s.title), s.title);
for (const s of removed) if (!index.has(norm(s.title))) index.set(norm(s.title), s.title);

const NOT_SONG = /^(前言|结尾|后记|关于|数据|Lineup|阵容|致辞|贺词|祝|引言|序|附录|乐曲公募|☆をつなぐ)/;

const rows = [];
for (const r of recs) {
  if (!r.title) continue;
  const hit = candidates(r.title).some((c) => index.has(norm(c)));
  if (hit) continue;
  rows.push({
    round: r.round,
    src: 'https://note-report.pages.dev/' + (PAGES[r.round] || ''),
    designer: r.designer || '',
    diff: r.diff || '',
    title: r.title,
    jp: String(r.jp || '').split('\n')[0].slice(0, 160),
    zh: String(r.zh || '').split('\n')[0].slice(0, 160),
    kind: NOT_SONG.test(r.title) || !r.diff ? '疑似小标题/非曲目' : '疑似歌曲（站内没有）',
  });
}

rows.sort((a, b) => a.round.localeCompare(b.round, 'ja') || a.title.localeCompare(b.title, 'ja'));

fs.writeFileSync('_tmp/build/unmatched-notes.json', JSON.stringify(rows, null, 1), 'utf8');
const byKind = rows.reduce((a, r) => ((a[r.kind] = (a[r.kind] || 0) + 1), a), {});
console.log('未匹配:', rows.length, JSON.stringify(byKind));
console.log('歌曲类样本:', rows.filter((r) => r.kind.includes('歌曲')).slice(0, 8).map((r) => r.title).join(' | '));
