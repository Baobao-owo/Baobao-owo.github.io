// 扫一遍单曲页的表格，找出「明明放得下却折成多行」和溢出的单元格
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const LIMIT = Number(process.env.LIMIT || 25);

const songs = JSON.parse(fs.readFileSync('public/chuni-songs.json', 'utf8'))
  .filter((s) => !s.we || !s.we.length)
  .slice(0, 400);
// 均匀取样
const picks = [];
const step = Math.max(1, Math.floor(songs.length / LIMIT));
for (let i = 0; i < songs.length && picks.length < LIMIT; i += step) picks.push(songs[i]);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 720, height: 1200, deviceScaleFactor: 1 });

const problems = [];
for (const s of picks) {
  try {
    await page.goto(BASE + s.u, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 400));
    const found = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.chuni-detail-table td').forEach((td) => {
        const cs = getComputedStyle(td);
        const text = (td.textContent || '').trim();
        if (!text || text.length < 12) return;
        // 估算：文本宽度 > 单元格宽度 时才算真的放不下
        const span = document.createElement('span');
        span.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + cs.font;
        span.textContent = text;
        document.body.appendChild(span);
        const need = span.getBoundingClientRect().width;
        span.remove();
        const avail = td.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const lines = Math.round(td.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || 18));
        if (need <= avail * 2.2 && lines > 2) {
          out.push({ text: text.slice(0, 40), need: Math.round(need), avail: Math.round(avail), lines });
        }
      });
      return out;
    });
    if (found.length) problems.push({ song: s.t, cells: found.slice(0, 3) });
  } catch (e) {}
}

console.log('检查页数:', picks.length, ' 有问题的:', problems.length);
problems.slice(0, 12).forEach((p) => {
  console.log('  ' + p.song);
  p.cells.forEach((c) => console.log('     "' + c.text + '"  需要 ' + c.need + 'px / 可用 ' + c.avail + 'px，' + c.lines + ' 行'));
});
await browser.close();
