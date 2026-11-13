import fs from 'node:fs';

// 1) 菜单里去掉「归档」
const y = 'source/_data/argon.yml';
let t = fs.readFileSync(y, 'utf8');
const before = t;
t = t.split(/\r?\n/).filter((line) => !/^\s*归档:\s*\/archives\s*$/.test(line)).join('\n');
fs.writeFileSync(y, t, 'utf8');
console.log('argon.yml changed:', before !== t);

// 2) 首页底部链接换成「全部分类」
const h = 'themes/argon/layout/home.ejs';
let ht = fs.readFileSync(h, 'utf8');
ht = ht.replace(
  /<a class="home-all-link" href="[^"]*archives[^"]*">[^<]*<\/a>/,
  '<a class="home-all-link" href="/categories/">全部分类 →</a>'
);
fs.writeFileSync(h, ht, 'utf8');
console.log('home.ejs changed:', /home-all-link/.test(ht), ht.match(/home-all-link[^>]*>[^<]*/)?.[0]);
