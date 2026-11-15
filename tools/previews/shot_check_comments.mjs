import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = 'D:\\Deepseek work\\blog\\_shots';

const targets = [
  { name: 'admin-comments', url: 'https://baobao-owo.github.io/admin/comments/', full: true },
  { name: 'song-comment', url: 'https://baobao-owo.github.io/chuni/b-b-k-k-b-k-k-ed7c82/', scroll: '#chuni-comment' },
];

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});

for (const t of targets) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
  try {
    await page.goto(t.url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (e) {
    console.log(t.name, 'goto warn:', String(e).slice(0, 120));
  }
  await new Promise((r) => setTimeout(r, 3500));

  const info = await page.evaluate((sel) => {
    const out = { title: document.title, bodyLen: document.body.innerText.length };
    if (sel) {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ block: 'center' });
      out.target = !!el;
    }
    out.iframes = document.querySelectorAll('iframe.giscus-frame').length;
    out.hasGiscusDiv = !!document.querySelector('#giscus');
    out.text = document.body.innerText.slice(0, 500);
    return out;
  }, t.scroll || null);
  await new Promise((r) => setTimeout(r, 2500));

  const path = `${OUT}\\${t.name}.png`;
  await page.screenshot({ path, fullPage: !!t.full });
  console.log('===', t.name, JSON.stringify({ title: info.title, target: info.target, iframes: info.iframes, hasGiscusDiv: info.hasGiscusDiv }));
  console.log('errors:', JSON.stringify(errors.slice(0, 4)));
  console.log('text:', info.text.replace(/\s+/g, ' ').slice(0, 260));
  await page.close();
}

await browser.close();
