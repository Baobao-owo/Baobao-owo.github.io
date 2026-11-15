import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.BASE || 'https://baobao-owo.github.io';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
await page.goto(BASE + '/chuni/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// 打开谱师面板 + 仅显示合作
await page.click('#chuni-designer-toggle');
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const t = document.querySelector('#chuni-collab-toggle');
  if (t && !t.classList.contains('active')) t.click();
});
await new Promise((r) => setTimeout(r, 300));

async function probe(designer, q) {
  await page.evaluate(() => {
    const s = document.querySelector('#chuni-search-title');
    s.value = '';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // 选谱师
  await page.evaluate(() => {
    const p = document.querySelector('#chuni-designer-panel');
    if (p && p.hidden) document.querySelector('#chuni-designer-toggle').click();
  });
  await page.evaluate(() => {
    const q2 = document.querySelector('#chuni-designer-q');
    q2.value = '';
    q2.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.type('#chuni-designer-q', designer);
  await new Promise((r) => setTimeout(r, 300));
  const picked = await page.evaluate(() => {
    const chip = document.querySelector('#chuni-designer-grid .chuni-dz-chip');
    if (!chip) return null;
    chip.click();
    return chip.getAttribute('data-who');
  });
  await page.evaluate(() => {
    const p = document.querySelector('#chuni-designer-panel');
    if (p && !p.hidden) document.querySelector('#chuni-designer-close').click();
  });
  await new Promise((r) => setTimeout(r, 300));
  // 搜曲
  await page.evaluate((qq) => {
    const s = document.querySelector('#chuni-search-title');
    s.value = qq;
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }, q);
  await new Promise((r) => setTimeout(r, 600));
  const rows = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.chuni-row')).map((r) => ({
      t: r.querySelector('.chuni-row-title')?.textContent.trim().slice(0, 40),
      tag: r.querySelector('.chuni-row-tag-ds')?.textContent.trim() || '',
    }))
  );
  return { picked, rows };
}

for (const who of ['じゃこレモン', '夕凪アロエ']) {
  const r = await probe(who, 'ギャグマンガ日和');
  console.log(who, '=>', JSON.stringify(r));
}
await browser.close();
