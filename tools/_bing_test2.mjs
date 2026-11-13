const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const pageRes = await fetch('https://www.bing.com/translator', {
  headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' }
});
const html = await pageRes.text();
const setCookie = pageRes.headers.getSetCookie ? pageRes.headers.getSetCookie() : [];
const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');

const ig = (html.match(/IG:"([^"]+)"/) || [])[1];
const iid = (html.match(/data-iid="([^"]+)"/) || [])[1];
const params = (html.match(/params_AbusePreventionHelper\s*=\s*\[([^\]]+)\]/) || [])[1];
const [key, token] = params.split(',').map((s) => s.replace(/["\s]/g, ''));

const body = new URLSearchParams({ fromLang: 'ja', to: 'zh-Hans', text: '称号条件のテスト', token, key });
const res = await fetch(`https://www.bing.com/ttranslatev3?isVertical=1&&IG=${ig}&IID=${iid}.1`, {
  method: 'POST',
  headers: {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://www.bing.com/translator',
    Cookie: cookie
  },
  body
});
const txt = await res.text();
console.log('status', res.status, 'ct', res.headers.get('content-type'));
console.log('body', txt.slice(0, 300));
