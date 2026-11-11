// 把 osu 上自己上传的谱面批量导入成文章。
// 用法：node tools/import_osu_maps.mjs [--dry]
// 列表来自 osu.direct 搜索接口，每套的难度数据来自 sayobot 的公开接口。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const POSTS = path.join(ROOT, 'source/_posts');
const dry = process.argv.includes('--dry');
const MAPPER = 'FDShijing';

const statusMap = {
  '-2': 'Graveyard',
  '-1': 'WIP',
  '0': 'Pending',
  '1': 'Pending',
  '2': 'Ranked',
  '3': 'Qualified',
  '4': 'Loved',
};

function yamlStr(v) {
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const p = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) +
    ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds())
  );
}

function secToLen(s) {
  const n = Number(s) || 0;
  return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
}

// 已经导入过的 set_id（含手写的那篇）
const existing = new Set();
for (const f of fs.readdirSync(POSTS)) {
  if (!f.endsWith('.md')) continue;
  const text = fs.readFileSync(path.join(POSTS, f), 'utf8');
  const m = text.match(/set_id:\s*(\d+)/);
  if (m) existing.add(m[1]);
}

console.log('已有 set_id:', existing.size);

const listRes = await fetch('https://osu.direct/api/search?q=' + MAPPER + '&amount=100');
if (!listRes.ok) throw new Error('列表请求失败 ' + listRes.status);
const list = await listRes.json();
const owned = list.filter((s) => s.Creator === MAPPER);
console.log('搜索结果', list.length, '自己的', owned.length);

let created = 0;
let skipped = 0;
let failed = 0;

for (const s of owned) {
  const sid = String(s.SetID);
  if (existing.has(sid)) {
    skipped++;
    continue;
  }
  let info;
  try {
    const r = await fetch('https://api.sayobot.cn/v2/beatmapinfo?0=' + sid);
    const j = await r.json();
    info = j.data;
  } catch (e) {
    console.log('取详情失败', sid, String(e).slice(0, 60));
    failed++;
    continue;
  }
  const bids = (info && info.bid_data) || [];
  if (!bids.length) {
    console.log('没有难度数据，跳过', sid);
    failed++;
    continue;
  }

  const first = bids[0];
  const keys = Math.round(Number(first.CS) || 4);
  const sub = keys === 4 ? '4k下落式' : '其它';
  const status = statusMap[String(info.approved)] || 'Graveyard';
  const date = fmtDate(s.SubmittedDate) || '2024-01-01 00:00:00';

  const lines = [];
  lines.push('---');
  lines.push('title: ' + yamlStr(info.title || s.Title || sid));
  lines.push('date: ' + date);
  lines.push('categories:');
  lines.push('  - 谱面记录');
  lines.push('  - ' + sub);
  lines.push('tags: [osu!mania, ' + keys + 'k' + ((info.source || s.Source) ? ', ' + yamlStr(info.source || s.Source) : '') + ']');
  lines.push('map:');
  lines.push('  artist: ' + yamlStr(info.artist || s.Artist || ''));
  lines.push('  mapper: ' + yamlStr(info.creator || MAPPER));
  lines.push('  keys: ' + keys);
  if (info.bpm) lines.push('  bpm: ' + info.bpm);
  lines.push('  status: ' + status);
  lines.push('  set_id: ' + sid);
  lines.push('  beatmap_id: ' + first.bid);
  lines.push('  diffs:');
  for (const b of bids) {
    lines.push('    - name: ' + yamlStr(b.version));
    lines.push('      sr: ' + Number(b.star || 0).toFixed(2));
    lines.push('      keys: ' + Math.round(Number(b.CS) || 4));
    if (b.HP) lines.push('      hp: ' + b.HP);
    if (b.OD) lines.push('      od: ' + b.OD);
    if (b.AR) lines.push('      ar: ' + b.AR);
    if (b.circles) lines.push('      circles: ' + b.circles);
    if (b.maxcombo) lines.push('      combo: ' + b.maxcombo);
    lines.push('      id: ' + b.bid);
    lines.push('      length: ' + yamlStr(secToLen(b.length)));
  }
  lines.push('---');
  lines.push('');

  const file = path.join(POSTS, 'osu-' + sid + '.md');
  if (dry) {
    console.log('[dry]', 'osu-' + sid + '.md', '|', info.title, '|', sub, '|', bids.length, 'diffs');
  } else {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('created', 'osu-' + sid + '.md', '|', info.title, '|', sub, '|', bids.length, 'diffs');
  }
  created++;
  await new Promise((r) => setTimeout(r, 200));
}

console.log('\nsummary: created', created, 'skipped', skipped, 'failed', failed);
