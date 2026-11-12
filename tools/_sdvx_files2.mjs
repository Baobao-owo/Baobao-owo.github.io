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
const res = await page.evaluate(async () => {
  const out = {};
  for (let i = 11; i <= 20; i++) {
    const f = 'songs' + String(i).padStart(2, '0') + '.json';
    try {
      const r = await fetch('/chunithm/_/json/' + f);
      if (!r.ok) { out[f] = 'HTTP ' + r.status; continue; }
      const j = await r.json();
      out[f] = Array.isArray(j) ? j.length : typeof j;
    } catch (e) { out[f] = 'err'; }
  }
  return out;
});
await browser.close();
console.log(JSON.stringify(res, null, 1));
