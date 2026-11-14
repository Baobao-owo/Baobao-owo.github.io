import fs from 'node:fs';

// 把「用户确认不是合作」的曲目统一放进 tools/collab-exclude.json
const items = [
  '[改]Oshama Scramble!',
  'タイムカプセル',
  '夜のサーカス',
];
fs.writeFileSync('tools/collab-exclude.json', JSON.stringify(items, null, 1) + '\n', 'utf8');
console.log('写入手工排除清单:', items.length, '首');
