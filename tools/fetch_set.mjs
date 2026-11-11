// 按谱面集 ID 拉 osu 谱面信息，输出可直接粘进文章的 front-matter。
// 用法：node tools/fetch_set.mjs 2285703
// 数据来源是 sayobot 的公开接口（osu 官网接口要 OAuth）。
const setid = process.argv[2];
if (!setid) {
  console.error('用法: node tools/fetch_set.mjs <谱面集ID>');
  process.exit(1);
}

const res = await fetch(`https://api.sayobot.cn/v2/beatmapinfo?0=${setid}`);
if (!res.ok) {
  console.error('请求失败:', res.status);
  process.exit(1);
}
const json = await res.json();
const d = json.data || {};
const bids = d.bid_data || [];
if (!bids.length) {
  console.error('没查到难度数据');
  process.exit(1);
}

const statusMap = { 2: 'Ranked', 1: 'Pending', 0: 'Pending', '-1': 'WIP', '-2': 'Graveyard', 4: 'Loved', 3: 'Qualified' };
const status = statusMap[String(d.approved)] || 'Graveyard';

const secToLen = (s) => {
  const n = Number(s) || 0;
  const m = Math.floor(n / 60);
  const sec = n % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const first = bids[0];
const lines = [];
lines.push('map:');
lines.push(`  artist: ${d.artist || ''}`);
lines.push(`  mapper: ${d.creator || ''}`);
lines.push(`  keys: ${Math.round(Number(first.CS) || 4)}`);
lines.push(`  bpm: ${first.BPM || ''}`);
lines.push(`  status: ${status}`);
lines.push(`  set_id: ${setid}`);
lines.push(`  beatmap_id: ${first.bid}`);
lines.push('  diffs:');
for (const b of bids) {
  lines.push(`    - name: ${b.version}`);
  lines.push(`      sr: ${Number(b.star || 0).toFixed(2)}`);
  lines.push(`      keys: ${Math.round(Number(b.CS) || 4)}`);
  lines.push(`      id: ${b.bid}`);
  lines.push(`      length: '${secToLen(b.length)}'`);
}

console.log(`# ${d.title} - ${d.artist}（${bids.length} 个难度）`);
console.log(lines.join('\n'));
