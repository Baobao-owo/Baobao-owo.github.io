// 补抓萌娘百科「音乐游戏/用语」等参考页（多域名重试）
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '_tmp/refs');
fs.mkdirSync(OUT, { recursive: true });
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const TARGETS = [
  ['用语', '音乐游戏/用语', ['https://zh.moegirl.org.cn/', 'https://mzh.moegirl.tw/', 'https://moegirl.icu/']],
  ['配置', '音乐游戏/配置', ['https://zh.moegirl.org.cn/', 'https://mzh.moegirl.tw/', 'https://moegirl.icu/']],
  ['梗2', '音乐游戏/梗', ['https://zh.moegirl.org.cn/']]
];

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(UA);

for (const [name, title, hosts] of TARGETS) {
  const file = path.join(OUT, name + '.txt');
  if (name !== '梗2' && fs.existsSync(file) && fs.statSync(file).size > 5000) {
    console.log(name, 'already exists');
    continue;
  }
  let ok = false;
  for (const host of hosts) {
    const url = host + encodeURIComponent(title);
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, 2500));
      const text = await page.evaluate(() => document.body.innerText);
      if (text && text.length > 3000) {
        fs.writeFileSync(file, text, 'utf8');
        console.log(name, 'OK', host, text.length);
        ok = true;
        break;
      }
      console.log(name, 'short', host, text ? text.length : 0);
    } catch (e) {
      console.log(name, 'ERR', host, String(e).slice(0, 60));
    }
  }
  if (!ok) console.log(name, 'FAILED');
  await new Promise((r) => setTimeout(r, 1500));
}
await browser.close();
