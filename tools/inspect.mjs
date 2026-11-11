import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4000/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 800));

const info = await page.evaluate(() => {
  const banner = document.querySelector('#banner');
  const cs = getComputedStyle(banner);
  const af = getComputedStyle(banner, '::after');
  const bf = getComputedStyle(banner, '::before');
  const rect = banner.getBoundingClientRect();
  const parents = [];
  let el = banner.parentElement;
  while (el && parents.length < 5) {
    parents.push({ tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 40), pos: getComputedStyle(el).position });
    el = el.parentElement;
  }
  return {
    banner: { top: rect.top, h: rect.height, position: cs.position, height: cs.height, minH: cs.minHeight, padTop: cs.paddingTop, padBot: cs.paddingBottom, bgSize: cs.backgroundSize, bgPos: cs.backgroundPosition, bgImg: cs.backgroundImage.slice(0, 80) },
    after: { content: af.content, position: af.position, top: af.top, bottom: af.bottom, height: af.height, z: af.zIndex, bg: af.backgroundImage.slice(0, 120), display: af.display },
    before: { content: bf.content, position: bf.position, height: bf.height, bg: bf.backgroundImage.slice(0, 100) },
    parents,
    titleRect: (() => { const t = document.querySelector('.banner-title'); const r = t.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; })(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
