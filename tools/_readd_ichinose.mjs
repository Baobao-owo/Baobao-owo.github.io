import fs from 'node:fs';
const p = 'tools/designer-manual.json';
const m = JSON.parse(fs.readFileSync(p, 'utf8'));
m.aliases['一ノ瀬 リズ'] = '一ノ瀬 リズ';
m.newDesigners = m.newDesigners || [];
if (!m.newDesigners.some((d) => d.name === '一ノ瀬 リズ')) {
  m.newDesigners.push({
    name: '一ノ瀬 リズ',
    aliases: ['一ノ瀬リズ'],
    note: 'wiki 一覧里有独立小节；朋友数据把她记成 ものくろっく 的别名，按 wiki 分出来',
  });
}
fs.writeFileSync(p, JSON.stringify(m, null, 2) + '\n', 'utf8');
console.log('aliases:', Object.keys(m.aliases).length, ' newDesigners:', m.newDesigners.map((x) => x.name).join(','));
