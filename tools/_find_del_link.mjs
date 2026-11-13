import fs from 'node:fs';

const h = fs.readFileSync('_tmp/wiki-we.html', 'utf8');
const re = /<a[^>]*href="([^"]+)"[^>]*>([^<]*配信停止[^<]*)<\/a>/g;
let m;
while ((m = re.exec(h))) {
  console.log(m[1], '|', m[2]);
}
