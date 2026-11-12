// 抓取 .c2s 谱面并渲染成平面图 SVG（当前只给白名单曲目用）
// 用法: node tools/render_chuni_charts.mjs --only "初音ミクの消失" [--force]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? (args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def;
};
const ONLY = opt('only', '');
const FORCE = !!opt('force', false);

const ROOT = process.cwd();
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni.json'), 'utf8'));
const ids = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/_data/chuni_ids.json'), 'utf8'));
const cfgText = fs.readFileSync(path.join(ROOT, 'source/_data/chuni_config.yml'), 'utf8');
const allowMatch = cfgText.match(/wiki_only:\s*\n((?:\s+-\s+.*\n)+)/);
const allow = allowMatch
  ? allowMatch[1].split('\n').map((l) => l.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  : [];

const targets = guide.songs.filter((s) => (ONLY ? s.title === ONLY : allow.indexOf(s.title) !== -1));
if (!targets.length) {
  console.log('没有目标曲目');
  process.exit(0);
}

const chartDir = path.join(ROOT, '_tmp/charts');
const outDir = path.join(ROOT, 'source/assets/chuni/preview');
fs.mkdirSync(chartDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const PY = 'C:\\Users\\33303\\.dsh\\dsh-runtimes\\dsh-primary-runtime\\dependencies\\python\\python.exe';
const token = process.env.GH_TOKEN || '';

async function fetchChart(name) {
  const local = path.join(chartDir, name);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  const url = `https://api.github.com/repos/QingQiz/MarisaBot/contents/Marisa.Frontend/public/assets/chunithm/chart/${name}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'dsh-blog' } });
  if (!res.ok) return null;
  const j = await res.json();
  const text = Buffer.from(j.content, 'base64').toString('utf8');
  fs.writeFileSync(local, text, 'utf8');
  return text;
}

let made = 0;
for (const song of targets) {
  const musicId = ids[song.title];
  if (!musicId) {
    console.log('没有 musicId:', song.title);
    continue;
  }
  const id4 = String(musicId).padStart(4, '0');
  for (let i = 0; i < song.sheets.length; i++) {
    const name = `${id4}_${String(i).padStart(2, '0')}.c2s`;
    const outSvg = path.join(outDir, `${musicId}_${i}.svg`);
    if (!FORCE && fs.existsSync(outSvg)) continue;
    const src = path.join(chartDir, name);
    if (!fs.existsSync(src)) {
      const text = await fetchChart(name);
      if (!text) {
        console.log('缺谱面文件:', name);
        continue;
      }
    }
    try {
      execFileSync(PY, [path.join(ROOT, 'tools/chart_svg.py'), src, outSvg, '--px', '60'], { stdio: 'pipe' });
      made++;
      console.log('渲染', name, '→', path.basename(outSvg));
    } catch (e) {
      console.log('渲染失败', name, String(e).slice(0, 80));
    }
  }
}
console.log('完成，渲染', made, '张');
