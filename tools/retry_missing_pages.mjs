import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DIR = '_tmp/wiki/songpage';
const titles = [
  'Grip & Break down !!',
  'ここで一席！　Oshama Scramble!',
  'Mass Destruction ("P3" + "P3F" ver.)',
  'Athlete Killer "Meteor"',
  '紅',
  'Re:Credits',
  'Flap&Clap',
  'RE:UNION -Duo Blade Against-',
  '[IMPERIALDISORDER]',
  'Little Busters!～TV animation ver.～',
];

const browser = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

for (const t of titles) {
  const url = 'https://wikiwiki.jp/chunithmwiki/' + encodeURIComponent(t);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 900));
    const html = await page.content();
    const ok = html.includes('譜面作者') || html.includes('担当');
    const missing = /ページが存在しません|有効なWikiName/.test(html);
    console.log(`${ok ? '✅' : '❌'} ${t}${missing ? '（页面不存在）' : ''}`);
    if (ok) fs.writeFileSync(DIR + '/' + t.replace(/[\\/:*?"<>|]/g, '_') + '.html', html, 'utf8');
  } catch (e) {
    console.log(`❌ ${t}（请求失败）`);
  }
  await new Promise((r) => setTimeout(r, 1200));
}
await browser.close();
