// 解析 note-report 会报页面 → 结构化评论（中日对照）v2
import fs from 'node:fs';

const PAGES = [
  ['chunithm-11th-report', '11 周年会报'],
  ['chunithm-10th-report', '10 周年会报'],
  ['chunithm-9th-report', '9 周年会报'],
  ['chunithm-8th-report', '8 周年会报'],
  ['chunithm-7th-report', '7 周年会报'],
  ['chunithm-penguin-secret-6', '企鹅秘话 第 6 话'],
  ['chunithm-penguin-secret-5', '企鹅秘话 第 5 话'],
  ['chunithm-penguin-secret-4', '企鹅秘话 第 4 话'],
  ['chunithm-penguin-secret-3', '企鹅秘话 第 3 话'],
  ['chunithm-penguin-secret-2', '企鹅秘话 第 2 话'],
  ['chunithm-penguin-secret-1', '企鹅秘话 第 1 话'],
];

function textOf(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitBlocks(blockHtml) {
  const paras = [...blockHtml.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)];
  const out = [];
  let cur = null;
  for (const m of paras) {
    const cls = m[1] || '';
    const plain = textOf(m[2]);
    if (/report-subheading/.test(cls) || /^■/.test(plain)) {
      const head = plain.replace(/^■/, '').trim();
      // 难度后缀有 (EXPERT)、【EXPERT】、【EXPERT】【MASTER】、(WORLD’S END) 等写法
      let title = head;
      const diffs = [];
      let mm;
      while ((mm = title.match(/[\s]*[（(【\[]\s*([A-Za-z\s'’]+?)\s*[)）】\]]\s*$/))) {
        diffs.unshift(mm[1].toUpperCase().trim());
        title = title.slice(0, mm.index).trim();
      }
      const diff = diffs.join(' / ');
      if (!title) { cur = null; continue; }
      cur = { title, diff, body: [] };
      out.push(cur);
    } else if (cur && plain) {
      cur.body.push(plain);
    }
  }
  return out.map((b) => ({ ...b, body: b.body.join('\n').trim() }));
}

function dedupeName(s) {
  const parts = String(s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0];
  const half = first.length >= 2 && first.length % 2 === 0 && first.slice(0, first.length / 2) === first.slice(first.length / 2);
  return half ? first.slice(0, first.length / 2) : first;
}

const records = [];
const perPage = {};

for (const [file, label] of PAGES) {
  const p = `_tmp/nr_${file}.html`;
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  // 按 <section ...> 切块（会报用 report-section，企鹅秘话用 episode-N）
  const secRe = /<section\b[^>]*>([\s\S]*?)<\/section>/gi;
  let count = 0;
  for (const m of html.matchAll(secRe)) {
    const sec = m[1];
    const zhDiv = sec.match(/<div class="[^"]*lang-block lang-zh[^"]*">([\s\S]*?)<\/div>/i);
    const jaDiv = sec.match(/<div class="[^"]*lang-block lang-ja[^"]*">([\s\S]*?)<\/div>/i);
    if (!zhDiv) continue;

    let designer = '';
    const h = sec.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    if (h) designer = textOf(h[1]);
    designer = dedupeName(designer);

    const zh = splitBlocks(zhDiv[1]);
    const ja = splitBlocks(jaDiv ? jaDiv[1] : '');
    // 按标题配对日文
    const jaMap = new Map();
    for (const j of ja) {
      const k = j.title.toLowerCase().replace(/\s+/g, '');
      if (!jaMap.has(k)) jaMap.set(k, j);
    }

    const sameLen = ja.length === zh.length;
    for (let zi = 0; zi < zh.length; zi++) {
      const z = zh[zi];
      if (!z.title || z.title.length > 80) continue;
      const k = z.title.toLowerCase().replace(/\s+/g, '');
      const j = (sameLen ? ja[zi] : null) || jaMap.get(k) || null;
      records.push({
        round: label,
        designer,
        title: z.title,
        diff: z.diff || (j && j.diff) || '',
        jp: j ? j.body : '',
        zh: z.body,
      });
      count++;
    }
  }
  perPage[label] = count;
}

fs.writeFileSync('_tmp/wiki/note_records.json', JSON.stringify(records, null, 1), 'utf8');
console.log('记录:', records.length);
console.log('按页:', JSON.stringify(perPage));
console.log('有日文:', records.filter((r) => r.jp).length, '| 有中文:', records.filter((r) => r.zh).length);
console.log('谱师数:', new Set(records.map((r) => r.designer)).size);
console.log('样本:', JSON.stringify(records[0]).slice(0, 300));
