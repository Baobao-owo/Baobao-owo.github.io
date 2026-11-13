import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
await page.goto('https://sdvx.in/chunithm.php', { waitUntil: 'networkidle2', timeout: 90000 });
const probe = await page.evaluate(async () => {
  const names = ['songs_we.json', 'we.json', 'worlds_end.json', 'songs_world.json', 'we_songs.json', 'songs_we01.json'];
  const out = {};
  for (const n of names) {
    try {
      const r = await fetch('/chunithm/_/json/' + n);
      if (!r.ok) { out[n] = 'HTTP ' + r.status; continue; }
      const j = await r.json();
      out[n] = Array.isArray(j) ? j.length : typeof j;
    } catch (e) { out[n] = 'err'; }
  }
  return out;
});
console.log(JSON.stringify(probe, null, 1));
await browser.close();
