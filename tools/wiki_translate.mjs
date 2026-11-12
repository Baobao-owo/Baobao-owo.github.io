// 把 wiki_comment（日文）机翻成中文，写入 wiki_zh
// 用法：node tools/wiki_translate.mjs [--limit 20] [--force]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? (args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const LIMIT = Number(opt('limit', 0)) || 0;
const FORCE = !!opt('force', false);

const ROOT = process.cwd();
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translate(text) {
  const q = encodeURIComponent(text.slice(0, 4800));
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=zh-CN&dt=t&q=' + q;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const segs = (data && data[0]) || [];
  return segs.map((s) => s[0]).join('');
}

let targets = Object.keys(extra).filter((k) => {
  const e = extra[k] || {};
  if (!e.wiki_comment && !e.wiki_jp) return false;
  if (!FORCE && e.wiki_zh) return false;
  return true;
});
if (LIMIT) targets = targets.slice(0, LIMIT);
console.log('待翻译:', targets.length);

let ok = 0;
let fail = 0;
for (const key of targets) {
  const e = extra[key];
  const src = e.wiki_comment || e.wiki_jp;
  if (!src) continue;
  let zh = '';
  for (let attempt = 0; attempt < 3 && !zh; attempt++) {
    try {
      zh = await translate(src);
    } catch (err) {
      await sleep(1500 * (attempt + 1));
    }
  }
  if (!zh) {
    fail++;
    console.log('翻译失败', key);
    continue;
  }
  e.wiki_zh = zh;
  ok++;
  console.log('ok', key, '|', zh.slice(0, 40).replace(/\n/g, ' '));
  fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
  await sleep(400);
}

fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
console.log('\n完成: 成功', ok, '失败', fail);
