// 从已保存的 wiki 曲目页里抽「情報」段落（曲目介绍）
import fs from 'node:fs';
import path from 'node:path';

const DIR = '_tmp/wiki/songs';
const titles = JSON.parse(fs.readFileSync('_tmp/wiki/crawl_titles.json', 'utf8'));

function plain(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

const STOP = /^(攻略|コメント|関連項目|外部リンク|脚注|参考|更新履歴|名前|※|詳細|解禁|譜面|称号|デザイン|イラスト|配信|収録|ジャンル|アーティスト|BPM|タイトル|難易度|備考|その他|こちらの|注意|余談)/;
const out = {};
const files = fs.readdirSync(DIR).filter((f) => /^\d+\.html$/.test(f));
for (const f of files) {
  const idx = Number(f.replace('.html', ''));
  const title = titles[idx - 1];
  if (!title) continue;
  const text = plain(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const lines = text.split('\n').map((l) => l.trim());
  const at = lines.findIndex((l) => l === '情報');
  if (at < 0) continue;
  const buf = [];
  for (let i = at + 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    if (STOP.test(l)) break;
    buf.push(l);
    if (buf.length >= 8) break;
  }
  const intro = buf.join('\n').trim();
  if (intro) out[title] = intro;
}

fs.writeFileSync('_tmp/wiki/removed-intros.json', JSON.stringify(out, null, 1), 'utf8');
console.log('抽到介绍:', Object.keys(out).length, '/', files.length);
const k = Object.keys(out)[0];
console.log('样本', k, '=>', JSON.stringify(out[k]).slice(0, 240));
