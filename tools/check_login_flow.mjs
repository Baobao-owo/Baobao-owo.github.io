import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text().slice(0, 120)));
page.on('pageerror', (e) => logs.push('pageerror: ' + String(e).slice(0, 160)));
page.on('requestfailed', (r) => logs.push('reqfail: ' + r.url().slice(0, 100)));

await page.goto('https://baobao-owo.github.io/admin/', { waitUntil: 'networkidle2', timeout: 90000 });
for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  const hasBtn = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button, a')).some((n) => (n.innerText || '').includes('GitHub'))
  );
  if (hasBtn) {
    console.log('login button appeared after ~' + (i * 1.5 + 1.5) + 's');
    break;
  }
}
const text = await page.evaluate(() => (document.body.innerText || '').replace(/\n+/g, ' | ').slice(0, 200));
console.log('text:', JSON.stringify(text));
console.log('logs:', JSON.stringify(logs.slice(0, 8)));

const btn = await page.evaluateHandle(() => {
  const nodes = Array.from(document.querySelectorAll('button, a'));
  return nodes.find((n) => (n.innerText || '').includes('GitHub')) || null;
});
if (btn.asElement()) {
  await btn.asElement().click();
  await new Promise((r) => setTimeout(r, 3500));
  console.log('after click url:', page.url().slice(0, 240));
} else {
  console.log('no button to click');
}
await page.screenshot({ path: 'D:\\Deepseek work\\blog\\_shots\\admin.png' });
await browser.close();
