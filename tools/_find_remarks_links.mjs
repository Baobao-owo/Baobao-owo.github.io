import fs from 'node:fs';

const h = fs.readFileSync('_tmp/wiki-we.html', 'utf8');
const re = /<a[^>]*href="([^"]+)"[^>]*>([^<]*各曲備考[^<]*)<\/a>/g;
let m;
while ((m = re.exec(h))) console.log(m[1], '|', m[2]);
console.log('--- page titles for 停 ---');
const re2 = /<a[^>]*href="([^"]+)"[^>]*>([^<]*停[^<]*)<\/a>/g;
let m2;
while ((m2 = re2.exec(h))) console.log(m2[1], '|', m2[2]);
