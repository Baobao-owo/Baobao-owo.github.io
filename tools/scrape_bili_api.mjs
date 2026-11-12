// 抓 B 站 UP 投稿列表（x/space/arc/search，无需登录），带限流退避和断点续跑
// 用法: node tools/scrape_bili_api.mjs [--mid 1573728] [--ps 50] [--max-pages 200]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] || def : def;
};
const MID = opt('mid', '1573728');
const PS = Math.min(Number(opt('ps', '50')) || 50, 50);
const MAX_PAGES = Number(opt('max-pages', '200')) || 200;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const REFERER = 'https://space.bilibili.com/' + MID + '/';

const outFile = path.join(process.cwd(), '_tmp/bili_uploads.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });

// 断点续跑
const seen = new Map();
let startPage = 1;
try {
  const prev = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  (prev.list || []).forEach((v) => seen.set(v.bv, v));
  startPage = Math.max(1, Math.ceil(seen.size / PS));
  if (seen.size) console.log('续跑：已有', seen.size, '从第', startPage, '页继续');
} catch (e) {}

let total = 0;

async function fetchPage(pn) {
  const url = 'https://api.bilibili.com/x/space/arc/search?mid=' + MID + '&ps=' + PS + '&pn=' + pn + '&order=pubdate&jsonp=jsonp';
  let last = null;
  for (let tries = 0; tries < 6; tries++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: REFERER } });
      const json = await res.json();
      if (json.code === 0) return json;
      last = json;
      if (json.code === -799) {
        const wait = 5000 * (tries + 1);
        console.log('限流，等待', wait / 1000, '秒后重试 pn=' + pn);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return json;
    } catch (e) {
      last = { code: -1, message: String(e).slice(0, 60) };
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return last || { code: -1, message: 'unknown' };
}

for (let pn = startPage; pn <= MAX_PAGES; pn++) {
  const json = await fetchPage(pn);
  if (!json || json.code !== 0) {
    console.log('停止于 pn=' + pn + '：', json && json.code, json && json.message);
    break;
  }
  const vlist = (json.data && json.data.list && json.data.list.vlist) || [];
  total = (json.data && json.data.page && json.data.page.count) || total;
  if (!vlist.length) break;
  for (const v of vlist) {
    if (!seen.has(v.bvid)) {
      seen.set(v.bvid, {
        bv: v.bvid,
        title: v.title,
        created: v.created,
        length: v.length,
        desc: (v.description || '').slice(0, 200)
      });
    }
  }
  fs.writeFileSync(outFile, JSON.stringify({ mid: MID, total, count: seen.size, list: Array.from(seen.values()) }, null, 1), 'utf8');
  console.log(`pn=${pn} 累计 ${seen.size}/${total || '?'}`);
  if (total && seen.size >= total) break;
  await new Promise((r) => setTimeout(r, 2000));
}

console.log('完成：总计', total, '已抓', seen.size, '→', outFile);
