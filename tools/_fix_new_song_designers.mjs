import fs from 'node:fs';

// 1) 一ノ瀬 リズ 独立成谱师（朋友那份把她当成 ものくろっく 的别名，和 wiki 对不上）
const manualFile = 'tools/designer-manual.json';
const manual = JSON.parse(fs.readFileSync(manualFile, 'utf8'));
manual.aliases['一ノ瀬 リズ'] = '一ノ瀬 リズ';
const has = (manual.newDesigners || []).some((d) => d.name === '一ノ瀬 リズ');
if (!has) {
  manual.newDesigners = manual.newDesigners || [];
  manual.newDesigners.push({
    name: '一ノ瀬 リズ',
    aliases: ['一ノ瀬リズ'],
    note: 'wiki 一覧里有独立小节；朋友数据把她记成 ものくろっく 的别名，这里按 Wiki 分出来',
  });
}
fs.writeFileSync(manualFile, JSON.stringify(manual, null, 2) + '\n', 'utf8');
console.log('manual: aliases', Object.keys(manual.aliases).length, ' newDesigners', manual.newDesigners.length);

// 2) 把「新曲按曲目页署名」也写进 designer-song-credits.json
const creditsFile = 'tools/designer-song-credits.json';
const credits = JSON.parse(fs.readFileSync(creditsFile, 'utf8'));
if (credits['きゅうくらりん'] && credits['きゅうくらりん'].m) {
  credits['きゅうくらりん'].m.who = '一ノ瀬 リズ';
}
fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 1) + '\n', 'utf8');
console.log('きゅうくらりん MAS →', credits['きゅうくらりん'].m.who);
