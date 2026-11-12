import fs from 'node:fs';
import crypto from 'node:crypto';

const id = '初音ミクの消失';
const f = '_tmp/wiki-cache/' + crypto.createHash('md5').update(id).digest('hex') + '.html';
const html = fs.readFileSync(f, 'utf8');
console.log('file:', f, html.length);

const start = html.indexOf('譜面定数変更履歴');
const seg = html.slice(Math.max(0, start - 800), start + 12000);

// 打印表格和小节标题，便于设计解析
const hd = [...seg.matchAll(/<h([34])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => m[2].replace(/<[^>]+>/g, '').trim());
console.log('headings:', JSON.stringify(hd));

const tables = [...seg.matchAll(/<table[\s\S]*?<\/table>/g)].slice(0, 4);
tables.forEach((t, i) => {
  const text = t[0].replace(/<[^>]+>/g, '|').replace(/\|{2,}/g, '|').replace(/\s+/g, ' ').slice(0, 400);
  console.log('table', i, ':', text);
});

const lists = [...seg.matchAll(/<ul[\s\S]*?<\/ul>/g)].slice(0, 4);
lists.forEach((l, i) => {
  const text = l[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400);
  console.log('list', i, ':', text);
});
