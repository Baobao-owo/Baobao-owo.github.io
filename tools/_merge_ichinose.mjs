import fs from 'node:fs';

// 一ノ瀬 リズ 确认是 ものくろっく 的别名：撤掉刚拆出来的独立条目
const mf = 'tools/designer-manual.json';
const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
m.aliases['一ノ瀬 リズ'] = 'ものくろっく';
m.aliases['一ノ瀬リズ'] = 'ものくろっく';
m.newDesigners = (m.newDesigners || []).filter((d) => d.name !== '一ノ瀬 リズ');
fs.writeFileSync(mf, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('newDesigners:', m.newDesigners.map((x) => x.name).join(',') || '(无)');

// きゅうくらりん 的 MAS 署名也跟着改回 ものくろっく
const cf = 'tools/designer-song-credits.json';
const c = JSON.parse(fs.readFileSync(cf, 'utf8'));
if (c['きゅうくらりん'] && c['きゅうくらりん'].m) {
  c['きゅうくらりん'].m.who = 'ものくろっく';
}
fs.writeFileSync(cf, JSON.stringify(c, null, 1) + '\n', 'utf8');
console.log('きゅうくらりん MAS =>', c['きゅうくらりん'].m.who);
