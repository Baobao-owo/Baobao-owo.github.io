// 从 wiki 曲目页里读出新曲需要的信息（BPM / 谱面作者 / 物量 / 版本 / 解禁）
import fs from 'node:fs';

function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const titles = process.argv.slice(2);
const out = {};
for (const t of titles) {
  const f = '_tmp/wiki/songpage/' + t.replace(/[\\/:*?"<>|]/g, '_') + '.html';
  if (!fs.existsSync(f)) {
    console.log('缺页面:', t);
    continue;
  }
  const text = txt(fs.readFileSync(f, 'utf8'));
  const pick = (re) => (text.match(re) || [])[1] || '';
  const info = {
    bpm: pick(/BPM\s*([0-9]{2,3})/),
    version: pick(/バージョン\s*([^ ]{1,20})/),
    designer: pick(/譜面作者【([^】]+)】/),
    notes: {},
  };
  // 物量表：Tap / Hold / Slide / Air / Flick / 合計
  const noteRow = text.match(/Tap\s*(\d+)\s*(?:※\S*\s*)?Hold\s*(\d+)\s*Slide\s*(\d+)\s*Air\s*(\d+)\s*Flick\s*(\d+)/);
  if (noteRow) {
    info.notes = { tap: noteRow[1], hold: noteRow[2], slide: noteRow[3], air: noteRow[4], flick: noteRow[5] };
  }
  const total = text.match(/合計\s*(\d+)/);
  if (total) info.notes.total = total[1];

  out[t] = info;
  console.log('## ' + t);
  console.log('   BPM:', info.bpm || '-', ' 版本:', info.version || '-');
  console.log('   谱面作者:', info.designer || '-');
  console.log('   物量:', JSON.stringify(info.notes));
}
fs.writeFileSync('_tmp/new-wiki-info.json', JSON.stringify(out, null, 1), 'utf8');
