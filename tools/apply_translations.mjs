// 把已翻译批次写回 chuni_extra.json（按日文标题匹配称号行，避免错位）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXTRA = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(EXTRA, 'utf8').replace(/^\uFEFF/, ''));

const batches = [
  '_tmp/batch1-sample10-verified.json',
  '_tmp/batch2-translated.json',
  '_tmp/batch3-translated.json',
  '_tmp/batch4-translated.json',
  '_tmp/batch5-translated.json',
  '_tmp/batch6-translated.json',
  '_tmp/batch7-translated.json',
  '_tmp/batch8-translated.json',
  '_tmp/batch9-translated.json',
  '_tmp/batch10-translated.json',
  '_tmp/batch11-translated.json',
  '_tmp/batch12-translated.json',
  '_tmp/batch13-translated.json',
  '_tmp/batch14-translated.json',
  '_tmp/batch15-translated.json',
  '_tmp/batch16-translated.json',
  '_tmp/batch17-translated.json',
  '_tmp/batch18-translated.json',
  '_tmp/batch19-translated.json',
  '_tmp/batch20-translated.json',
  '_tmp/batch21-translated.json',
  '_tmp/batch22-translated.json',
  '_tmp/batch23-translated.json',
  '_tmp/batch24-translated.json',
  '_tmp/batch25-translated.json',
  '_tmp/batch26-translated.json',
  '_tmp/batch27-translated.json',
  '_tmp/batch28-translated.json',
  '_tmp/batch29-translated.json',
  '_tmp/batch30-translated.json',
  '_tmp/batch31-translated.json',
  '_tmp/batch32-translated.json',
  '_tmp/batch33-translated.json',
  '_tmp/batch34-translated.json',
  '_tmp/batch35-translated.json',
  '_tmp/batch36-translated.json',
  '_tmp/batch37-translated.json',
  '_tmp/batch38-translated.json',
  '_tmp/batch39-translated.json',
  '_tmp/batch40-translated.json',
  '_tmp/batch41-translated.json',
  '_tmp/batch42-translated.json',
  '_tmp/batch43-translated.json',
  '_tmp/batch44-translated.json',
  '_tmp/batch45-translated.json',
  '_tmp/batch46-translated.json',
  '_tmp/batch47-translated.json',
  '_tmp/batch48-translated.json',
  '_tmp/batch49-translated.json',
  '_tmp/batch50-translated.json',
  '_tmp/batch51-translated.json',
  '_tmp/batch52-translated.json',
  '_tmp/batch53-translated.json',
  '_tmp/batch54-translated.json',
  '_tmp/batch55-translated.json',
  '_tmp/batch56-translated.json',
  '_tmp/batch57-translated.json',
  '_tmp/batch58-translated.json',
  '_tmp/batch59-translated.json',
  '_tmp/batch60-translated.json',
  '_tmp/batch61-translated.json',
  '_tmp/batch62-translated.json',
  '_tmp/batch63-translated.json',
  '_tmp/batch64-translated.json',
  '_tmp/batch65-translated.json',
  '_tmp/batch66-translated.json',
  '_tmp/batch67-translated.json',
  '_tmp/batch68-translated.json',
  '_tmp/batch69-translated.json',
  '_tmp/batch70-translated.json',
  '_tmp/batch71-translated.json',
  '_tmp/batch72-translated.json',
  '_tmp/batch73-translated.json',
  '_tmp/batch74-translated.json',
  '_tmp/batch76-translated.json',
  '_tmp/batch77-translated.json',
  '_tmp/batch78-translated.json'
];

function norm(s) {
  return String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '').replace(/[!！?？:：;；,，.。~～\-–—]/g, '');
}

let introN = 0;
let titleN = 0;
let originN = 0;

for (const f of batches) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const list = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const song of list) {
    const e = extra[song.song];
    if (!e) continue;

    const intro = song.items.filter((i) => i.type === '介绍').map((i) => i.zh);
    const origins = song.items.filter((i) => i.type === '由来').map((i) => i.zh);
    const titles = song.items.filter((i) => i.type === '称号').map((i) => ({ jp: i.jp, zh: i.zh }));

    if (intro.length) {
      e.wiki_comment_zh = intro.join('\n');
      introN++;
    }
    if (origins.length) {
      const ja = e.origins || [];
      if (origins.length >= ja.length) e.origins_zh = origins;
      else e.origins_zh = origins.concat(ja.slice(origins.length));
      originN++;
    }
    if (titles.length) {
      const jaRows = (e.titles || []).slice(1);
      const zhRows = (e.titles_zh || []).slice(1);
      let matched = 0;
      for (const t of titles) {
        const idx = jaRows.findIndex((r) => norm(r[0]) === norm(t.jp));
        if (idx >= 0) {
          const cond = zhRows[idx] ? zhRows[idx][1] : (jaRows[idx][1] || '');
          zhRows[idx] = [t.zh, cond];
          matched++;
        }
      }
      e.titles_zh = [((e.titles || [])[0] || ['称号', '条件'])].concat(zhRows);
      if (matched) titleN++;
    }
  }
}

fs.writeFileSync(EXTRA, JSON.stringify(extra, null, 1), 'utf8');
console.log('写入曲目：介绍', introN, '称号', titleN, '由来', originN);
