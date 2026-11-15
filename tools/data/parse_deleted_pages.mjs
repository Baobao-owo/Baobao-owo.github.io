// 解析已抓取的 wiki 单曲页 → 结构化 JSON
// 输入：_tmp/wiki/songs/<n>.html + _tmp/wiki/crawl_titles.json
// 输出：_tmp/wiki/parsed_songs.json
import fs from 'node:fs';

const titles = JSON.parse(fs.readFileSync('_tmp/wiki/crawl_titles.json', 'utf8'));
const DIR = '_tmp/wiki/songs';

function txt(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, ' ')
    .trim();
}

function tablesOf(html) {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
}

function rowsOf(table) {
  return [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[hd][\s\S]*?<\/t[hd]>/gi)].map((c) => txt(c[0]))
  );
}

const DIFFS = ['basic', 'advanced', 'expert', 'master', 'ultima'];
const out = [];

for (let i = 1; i <= titles.length; i++) {
  const file = `${DIR}/${i}.html`;
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const html = raw.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

  const rec = { title: titles[i - 1], genre: '', artist: '', bpm: '', release: '', removedAt: '', version: '', cover: '', sheets: [], notes: [] };

  // 封面：第一张非 header 的 ref 图
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, '&'));
  const cover = imgs.find((u) => u.includes('::ref/') && !u.includes(':Header'));
  if (cover) rec.cover = cover;

  for (const t of tablesOf(html)) {
    const rows = rowsOf(t);
    // 楽曲情報
    if (rows.some((r) => r[0] === 'ジャンル')) {
      for (const r of rows) {
        if (r[0] === 'ジャンル') rec.genre = r[1] || '';
        if (r[0] === 'タイトル') rec.title = r[1] || rec.title;
        if (r[0] === 'アーティスト') rec.artist = r[1] || '';
        if (r[0] === 'BPM') rec.bpm = (r[1] || '').replace(/[^\d.]/g, '');
        if (r[0] === '解禁方法') {
          const s = r[1] || '';
          const m1 = s.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
          if (m1) rec.release = m1[1];
          const m2 = s.match(/(\d{4}\/\d{1,2}\/\d{1,2})\s*(?:配信停止|停止)/);
          if (m2) rec.removedAt = m2[1];
        }
      }
      continue;
    }
    // 物量表：Lv / 総数 / 内訳 / Tap Hold Slide Air Flick
    if (rows.some((r) => r[0] === 'Lv' && r.includes('総数'))) {
      for (const r of rows) {
        if (r[0] === 'Lv' || !/^\d/.test(r[0] || '')) continue;
        rec.notes.push({ level: r[0], total: r[1], tap: r[2], hold: r[3], slide: r[4], air: r[5], flick: r[6] });
      }
      continue;
    }
    // 版本 + 定数表：バージョン | B | A | E | M
    if (rows.some((r) => r[0] === 'バージョン')) {
      const dataRows = rows.filter((r) => r[0] && r[0] !== 'バージョン');
      if (dataRows.length) {
        rec.version = dataRows[0][0] || '';
        rec.sheets = ['basic', 'advanced', 'expert', 'master', 'ultima']
          .map((d, idx) => ({ d, lv: dataRows[0][idx + 1] || '' }))
          .filter((x) => x.lv);
      }
      continue;
    }
  }

  out.push(rec);
}

fs.writeFileSync('_tmp/wiki/parsed_songs.json', JSON.stringify(out, null, 1), 'utf8');
console.log('parsed:', out.length);
console.log(JSON.stringify(out[0] || {}, null, 1).slice(0, 700));
