// 导入 pgko.dev 上自己的中二自制谱（歌包 + 谱面难度）
// 用法：node tools/import_chuni.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ROOT = process.cwd();
const POSTS = path.join(ROOT, 'source/_posts');
const dry = process.argv.includes('--dry');
const PROFILE = 'https://pgko.dev/users/fdshijing';

const yamlStr = (v) => "'" + String(v).replace(/'/g, "''") + "'";

function parseDate(text) {
  const m = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${m[1]}-${p(m[2])}-${p(m[3])} 12:00:00`;
}

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400 });

// 1. 先从个人页抓歌包列表（id / 封面 / 卡片文字）
await page.goto(PROFILE, { waitUntil: 'networkidle2', timeout: 90000 });
await new Promise((r) => setTimeout(r, 4000));
for (let i = 0; i < 12; i++) {
  await page.evaluate(() => window.scrollBy(0, 1200));
  await new Promise((r) => setTimeout(r, 700));
}
const list = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  document.querySelectorAll('a[href*="/bundles/"]').forEach((a) => {
    const m = a.href.match(/\/bundles\/([0-9a-f-]{36})/);
    if (!m) return;
    const id = m[1];
    if (seen.has(id)) return;
    let el = a;
    let card = null;
    for (let i = 0; i < 8 && el; i++) {
      el = el.parentElement;
      if (el && el.querySelector('img') && (el.innerText || '').length > 20) { card = el; break; }
    }
    seen.add(id);
    const img = card ? card.querySelector('img') : null;
    out.push({ id, img: img ? img.getAttribute('src') : null, text: card ? (card.innerText || '').replace(/\s+/g, ' ').slice(0, 300) : '' });
  });
  return out;
});
console.log('歌包数量:', list.length);

let created = 0;
for (const item of list) {
  const url = 'https://pgko.dev/bundles/' + item.id;
  let detail;
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    detail = await page.evaluate(() => {
      const lines = document.body.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
      return { lines };
    });
  } catch (e) {
    console.log('抓取失败', item.id, String(e).slice(0, 60));
    continue;
  }

  const lines = detail.lines;
  const backIdx = lines.indexOf('返回');
  const title = backIdx >= 0 ? lines[backIdx + 1] : '';
  const artist = backIdx >= 0 ? lines[backIdx + 2] : '';
  const authors = backIdx >= 0 ? lines[backIdx + 3] : '';

  // 难度：找「谱面（N）」之后，交替出现 [分类, 数值, 曲名, 艺术家, 谱师]
  const diffs = [];
  const startIdx = lines.findIndex((l) => /^谱面（\d+）$/.test(l));
  if (startIdx >= 0) {
    const classRe = /^(\d{1,2}\+?|速|WE|WE\+)$/;
    const valueRe = /^(\d{1,2}(\.\d)?|\d★)$/;
    for (let i = startIdx + 1; i < lines.length - 1; i++) {
      if (/^\d+ \/ \d+ 个谱面$/.test(lines[i])) break;
      if (classRe.test(lines[i]) && valueRe.test(lines[i + 1])) {
        diffs.push({ cls: lines[i], value: lines[i + 1], name: lines[i + 2] || '', mapper: lines[i + 4] || '' });
        i += 4;
      }
    }
  }

  const date = parseDate(item.text) || '2026-01-01 12:00:00';
  const file = path.join(POSTS, 'chuni-' + item.id.slice(-8) + '.md');
  if (fs.existsSync(file) && !process.argv.includes('--force')) {
    console.log('已存在，跳过', path.basename(file));
    continue;
  }

  const out = [];
  out.push('---');
  out.push('title: ' + yamlStr(title || '未命名'));
  out.push('date: ' + date);
  out.push('categories:');
  out.push('  - 中二节奏');
  out.push('tags: [CHUNITHM, 自制谱]');
  out.push('chuni:');
  out.push('  artist: ' + yamlStr(artist));
  out.push('  authors: ' + yamlStr(authors));
  out.push('  bundle: ' + yamlStr(url));
  if (item.img) out.push('  cover: ' + yamlStr(item.img));
  out.push('  diffs:');
  for (const d of diffs) {
    out.push('    - cls: ' + yamlStr(d.cls));
    out.push('      value: ' + yamlStr(d.value));
    if (d.mapper) out.push('      mapper: ' + yamlStr(d.mapper));
  }
  out.push('---');
  out.push('');

  if (dry) {
    console.log('[dry]', path.basename(file), '|', title, '|', artist, '|', diffs.map((d) => d.cls + '/' + d.value).join(', '));
  } else {
    fs.writeFileSync(file, out.join('\n'), 'utf8');
    console.log('created', path.basename(file), '|', title, '|', diffs.length, 'diffs');
  }
  created++;
  await new Promise((r) => setTimeout(r, 400));
}

await browser.close();
console.log('\nsummary: created', created, 'of', list.length);
