// 试一下 Bing 翻译接口是否可用（提取 token 后调用）
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const pageRes = await fetch('https://www.bing.com/translator', {
  headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' }
});
const html = await pageRes.text();
console.log('page status', pageRes.status, 'len', html.length);

// IG / IID / token 提取
const ig = (html.match(/IG:"([^"]+)"/) || [])[1];
const iid = (html.match(/data-iid="([^"]+)"/) || [])[1];
const params = (html.match(/params_AbusePreventionHelper\s*=\s*\[([^\]]+)\]/) || [])[1];
console.log('IG', ig, 'IID', iid, 'params', params && params.slice(0, 60));

if (ig && params) {
  const [key, token] = params.split(',').map((s) => s.replace(/["\s]/g, ''));
  const body = new URLSearchParams({ fromLang: 'ja', to: 'zh-Hans', text: '称号条件のテスト', token, key });
  const res = await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&&IG=${ig}&IID=${iid || 'translator.5028'}.1`, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const txt = await res.text();
  console.log('translate', res.status, txt.slice(0, 200));
}
