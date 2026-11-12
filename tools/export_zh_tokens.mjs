// 用占位符保护术语再翻译（机翻会保留 Latin 占位符，事后再换回中文）
import fs from 'node:fs';

const ROOT = process.cwd();
const extra = JSON.parse(fs.readFileSync(ROOT + '/source/_data/chuni_extra.json', 'utf8').replace(/^\uFEFF/, ''));

// 顺序：长词优先
const TERMS = [
  ['元次課題曲', 'ZKQ1'],
  ['元課題曲', 'ZKQ2'],
  ['課題曲', 'ZKQ3'],
  ['対応キャラ', 'ZKQ4'],
  ['エリア', 'ZKQ5'],
  ['譜面', 'ZKQ6'],
  ['解禁', 'ZKQ7'],
  ['ノーツ', 'ZKQ8'],
  ['スキル', 'ZKQ9'],
  ['称号', 'ZKQ10'],
  ['通常配信', 'ZKQ11'],
  ['配信停止', 'ZKQ12'],
  ['マップ', 'ZKQ13'],
  ['イベント', 'ZKQ14'],
  ['難易度', 'ZKQ15'],
  ['ジャンル', 'ZKQ16']
];

const BACK = {
  ZKQ1: '原次课题曲',
  ZKQ2: '原课题曲',
  ZKQ3: '课题曲',
  ZKQ4: '对应角色',
  ZKQ5: '区域',
  ZKQ6: '谱面',
  ZKQ7: '解锁',
  ZKQ8: '音符',
  ZKQ9: '技能',
  ZKQ10: '称号',
  ZKQ11: '通常配信',
  ZKQ12: '停止配信',
  ZKQ13: '地图',
  ZKQ14: '活动',
  ZKQ15: '难度',
  ZKQ16: '分类'
};

const JUNK = [/fontawesome/i, /^情報/, /^-->\s*$/, /^※$/];

function prepare(ja) {
  const lines = String(ja)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !JUNK.some((re) => re.test(l)));
  return lines.map((line) => {
    let out = line;
    for (const [jp, token] of TERMS) out = out.split(jp).join(token);
    return out;
  });
}

const pending = [];
for (const [k, e] of Object.entries(extra)) {
  const ja = e.wiki_comment || '';
  if (!ja) continue;
  const lines = prepare(ja);
  if (!lines.length) continue;
  pending.push({ k, t: lines.join('\n').slice(0, 4500) });
}

fs.writeFileSync(ROOT + '/_tmp/zh-tokens-pending.json', JSON.stringify(pending), 'utf8');
fs.writeFileSync(ROOT + '/_tmp/zh-tokens-back.json', JSON.stringify(BACK), 'utf8');
const h = Math.ceil(pending.length / 2);
fs.writeFileSync(ROOT + '/_tmp/zh-tokens-a.json', JSON.stringify(pending.slice(0, h)), 'utf8');
fs.writeFileSync(ROOT + '/_tmp/zh-tokens-b.json', JSON.stringify(pending.slice(h)), 'utf8');
console.log('待翻译（占位符）:', pending.length, '| 分两份', h, pending.length - h);
