import fs from 'node:fs';
import path from 'node:path';

const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const norm = (s) => String(s || '').toLowerCase().replace(/[\s\u3000]+/g, '').replace(/[!-/:-@\[-`{-~]/g, '');
const outDir = '_tmp/reports';
fs.mkdirSync(outDir, { recursive: true });
const write = (name, lines) => { fs.writeFileSync(path.join(outDir, name), lines.join('\r\n'), 'utf8'); console.log(name, lines.length - 1, 'lines'); };

const chuni = J('source/_data/chuni.json').songs;
const removed = J('source/_data/chuni_removed_songs.json');
const notes = J('source/_data/chuni_notes.json');
const ids = J('source/_data/chuni_ids.json');
const previews = J('source/_data/chuni_previews.json');
const collab = J('source/assets/data/collab.json').songs;
const docx = J('source/_data/collab_docx_titles.json');
const partsD = J('source/_data/collab_parts.json');
const partsA = J('source/assets/data/collab-parts.json');
const idx = { basic: 0, advanced: 1, expert: 2, master: 3, ultima: 4, we: 5 };

const liveTitles = new Set(chuni.map(s => s.title));
const removedTitles = new Set(removed.map(s => s.title));

// 1. 谱师留言对不上的
const unmatchedNotes = Object.keys(notes).filter(t => !liveTitles.has(t) && !removedTitles.has(t));
{
  const lines = ['曲名\t状态\t日文开头'];
  for (const t of unmatchedNotes) {
    const arr = notes[t];
    const first = Array.isArray(arr) ? arr[0] : arr;
    const jp = String((first && first.jp) || '').replace(/\s+/g, ' ').slice(0, 60);
    lines.push(`${t}\t无对应曲目\t${jp}`);
  }
  write('notes-unmatched.tsv', lines);
}

// 2. 合作并集/差集
{
  const docxSet = new Set(docx.map(norm));
  const jsonSet = new Set(Object.keys(collab).map(norm));
  const both = [...docxSet].filter(x => jsonSet.has(x));
  const docxOnly = [...docxSet].filter(x => !jsonSet.has(x));
  const jsonOnly = [...jsonSet].filter(x => !docxSet.has(x));
  const titleOf = new Map();
  for (const t of docx) titleOf.set(norm(t), t);
  for (const s of chuni) if (!titleOf.has(norm(s.title))) titleOf.set(norm(s.title), s.title);
  const lines = [`统计\t数量`, `docx 白名单\t${docxSet.size}`, `collab.json\t${jsonSet.size}`, `交集\t${both.length}`, `仅 docx\t${docxOnly.length}`, `仅 collab.json\t${jsonOnly.length}`, ''];
  lines.push('差异类型\t曲名');
  for (const k of docxOnly) lines.push(`仅 docx 说合作\t${titleOf.get(k) || k}`);
  for (const k of jsonOnly) lines.push(`仅 collab.json 有参与者\t${titleOf.get(k) || k}`);
  write('collab-union-diff.tsv', lines);
}

// 3. 分工表两份对比
{
  const same = JSON.stringify(partsD) === JSON.stringify(partsA);
  const lines = [`两份是否完全相同\t${same ? '是' : '否'}`, `_data 条数\t${Object.keys(partsD).length}`, `assets 条数\t${Object.keys(partsA).length}`];
  if (!same) {
    const keys = new Set([...Object.keys(partsD), ...Object.keys(partsA)]);
    for (const k of keys) {
      const a = JSON.stringify(partsD[k] || null), b = JSON.stringify(partsA[k] || null);
      if (a !== b) lines.push(`${k}\t_data=${a.slice(0, 80)}\tassets=${b.slice(0, 80)}`);
    }
  }
  write('parts-sync-diff.tsv', lines);
}

// 4. 版本 null 列表
{
  const lines = ['曲名\tmusicId\t现有版本'];
  let n = 0;
  for (const s of chuni) {
    if (s.version === null || s.version === undefined || s.version === 'null' || s.version === '') {
      n++;
      lines.push(`${s.title}\t${ids[s.title] ?? ''}\t${s.version}`);
    }
  }
  write('version-null.tsv', lines);
  console.log('version null', n);
}

// 5. 预览缺失 + HDD 里有没有 c2s
const dirs = [
  ['Mate', 'D:/SDHD - CHUNITHM Mate/HDD/data/A000/music'],
  ['MateA300', 'D:/SDHD - CHUNITHM Mate/HDD/bin/option/A300/music'],
  ['XVX', 'D:/XVX/HDD/data/A000/music'],
  ['XVXA300', 'D:/XVX/HDD/bin/option/A300/music'],
];
const hasC2s = (dir, mid) => {
  const d = path.join(dir, 'music' + String(mid).padStart(4, '0'));
  try {
    if (!fs.existsSync(d)) return false;
    return fs.readdirSync(d).some(f => f.endsWith('.c2s'));
  } catch { return false; }
};
{
  const lines = ['曲名\tmusicId\t难度\tMate\tMateA300\tXVX\tXVXA300'];
  const removedIds = new Set(removed.map(r => ids[r.title]).filter(x => x != null));
  let n = 0;
  for (const s of chuni) {
    const mid = ids[s.title];
    for (const sh of s.sheets || []) {
      const i = idx[String(sh.difficulty).toLowerCase()];
      if (i == null) continue;
      if (mid != null && previews[`${mid}_${i}`]) continue;
      n++;
      const flags = dirs.map(([, dir]) => hasC2s(dir, mid) ? '有' : '');
      lines.push(`${s.title}\t${mid ?? ''}\t${sh.difficulty}\t${flags.join('\t')}`);
    }
  }
  write('preview-missing-with-hdd.tsv', lines);
  console.log('preview missing', n);
}
