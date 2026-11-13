import fs from 'node:fs';

const m = JSON.parse(fs.readFileSync('source/_data/chuni_previews.json', 'utf8'));
const g = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('source/_data/chuni_ids.json', 'utf8').replace(/^\uFEFF/, ''));
const HDD = JSON.parse(fs.readFileSync('_tmp/hdd-music.json', 'utf8'));
const CH = JSON.parse(fs.readFileSync('_tmp/hdd-we-charts.json', 'utf8'));

function norm(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[!！?？:：;；,，.。~～\-–—_'"“”‘’「」『』【】\[\]()（）〈〉《》・/\\|]/g, '');
}

const we = g.songs.filter((s) => (s.sheets || []).length && s.sheets.every((x) => String(x.difficulty).startsWith('【')));
let has = 0;
let noTitle = 0;
let noChart = 0;
const noChartList = [];
for (const s of we) {
  const mid = ids[String(s.title).trim()];
  if (m[mid + '_5']) {
    has++;
    continue;
  }
  const hit = Object.entries(HDD).find(([i, v]) => Number(i) >= 8000 && norm(v.title) === norm(s.title));
  if (!hit) {
    noTitle++;
    continue;
  }
  if (!CH[hit[0]]) {
    noChart++;
    noChartList.push(s.title + ' (' + hit[0] + ')');
    continue;
  }
  noChart++;
}
console.log('WE 总', we.length, '| 有预览', has, '| 无标题映射', noTitle, '| 有标题缺谱面文件', noChart);
console.log(noChartList.slice(0, 10).join(' | '));
