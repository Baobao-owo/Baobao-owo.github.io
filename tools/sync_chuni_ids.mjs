// 用增量包里的 Music.xml 补齐 chuni_ids.json 的「曲名 → 游戏 id」
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'D:/QQ/Downloads/option (1)';
const IDS_FILE = 'source/_data/chuni_ids.json';
const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8')).songs;
const ids = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8').replace(/^\uFEFF/, ''));

const decode = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const siteTitles = new Set(site.map((s) => String(s.title).trim()));
const byNorm = new Map(site.map((s) => [String(s.title).normalize('NFKC').toLowerCase().replace(/\s+/g, ''), String(s.title).trim()]));

let added = 0;
const unknown = [];

(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'Music.xml') {
      const xml = fs.readFileSync(p, 'utf8');
      const nameM = xml.match(/<name>[\s\S]*?<str>([\s\S]*?)<\/str>/);
      const idM = xml.match(/<name>[\s\S]*?<id>(\d+)<\/id>/);
      if (!nameM) continue;
      const title = decode(nameM[1]).trim();
      const num = Number(idM ? idM[1] : path.basename(path.dirname(p)).replace(/\D/g, ''));
      if (!title || !num) continue;
      const key = title.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
      const siteTitle = siteTitles.has(title) ? title : byNorm.get(key);
      if (!siteTitle) { unknown.push(title); continue; }
      if (ids[siteTitle] === undefined) { ids[siteTitle] = num; added++; }
    }
  }
})(ROOT);

fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 1) + '\n', 'utf8');
console.log('补齐 id:', added, '| 站内找不到的曲名:', new Set(unknown).size);
