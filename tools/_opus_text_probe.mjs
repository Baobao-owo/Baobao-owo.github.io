import puppeteer from 'puppeteer-core';

const ids = ['1259725942475980849', '1225586106390544403', '1207414323100516372'];
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
);
for (const id of ids) {
  await page.goto(`https://www.bilibili.com/opus/${id}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));
  const text = await page.evaluate(() => document.body.innerText);
  const hit = /删除|下架|配信停止/.test(text);
  console.log('==', id, 'contains:', hit, 'len', text.length);
  if (hit) {
    const i = text.search(/删除|下架|配信停止/);
    console.log(text.slice(Math.max(0, i - 200), i + 400).replace(/\n+/g, ' | '));
  }
  await new Promise((r) => setTimeout(r, 500));
}
await browser.close();
