// 把 wiki 的日文内容机翻成中文：wiki_comment → wiki_zh，wiki_extra_ja → wiki_extra_zh
// 用法：
//   node tools/wiki_translate.mjs --only "初音ミクの消失"
//   node tools/wiki_translate.mjs --limit 5
//   node tools/wiki_translate.mjs --force
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? (args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const LIMIT = Number(opt('limit', 0)) || 0;
const ONLY = opt('only', '');
const FORCE = !!opt('force', false);

const ROOT = process.cwd();
const extraPath = path.join(ROOT, 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translate(text) {
  const q = encodeURIComponent(String(text).slice(0, 4800));
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=zh-CN&dt=t&q=' + q;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      },
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const segs = (data && data[0]) || [];
    return segs.map((s) => s[0]).join('');
  } finally {
    clearTimeout(timer);
  }
}

async function runJob(items, label) {
  let ok = 0;
  let fail = 0;
  for (const key of items) {
    const e = extra[key];
    const src = label === 'comment' ? e.wiki_comment || e.wiki_jp : e.wiki_extra_ja;
    if (!src) continue;
    let zh = '';
    for (let attempt = 0; attempt < 2 && !zh; attempt++) {
      try {
        zh = await translate(src);
      } catch (err) {
        console.log('  重试', key, String(err).slice(0, 40));
        await sleep(800);
      }
    }
    if (!zh) {
      fail++;
      console.log('失败', label, key);
      continue;
    }
    if (label === 'comment') e.wiki_zh = zh;
    else e.wiki_extra_zh = zh;
    fs.writeFileSync(extraPath, JSON.stringify(extra, null, 1), 'utf8');
    ok++;
    console.log('ok', label, key, '|', zh.slice(0, 30).replace(/\n/g, ' '));
    await sleep(300);
  }
  console.log(label, '完成: 成功', ok, '失败', fail);
}

let keys = Object.keys(extra);
if (ONLY) keys = keys.filter((k) => k === ONLY);
keys.sort();

let commentTargets = keys.filter((k) => {
  const e = extra[k] || {};
  if (!(e.wiki_comment || e.wiki_jp)) return false;
  return FORCE || !e.wiki_zh;
});
let extraTargets = keys.filter((k) => {
  const e = extra[k] || {};
  if (!e.wiki_extra_ja) return false;
  return FORCE || !e.wiki_extra_zh;
});
if (LIMIT) {
  commentTargets = commentTargets.slice(0, LIMIT);
  extraTargets = extraTargets.slice(0, LIMIT);
}

console.log('待翻译 介绍:', commentTargets.length, '| 小节:', extraTargets.length);
await runJob(commentTargets, 'comment');
await runJob(extraTargets, 'extra');
