import fs from 'node:fs';

const path = 'source/_data/chuni_extra.json';
const raw = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const e = JSON.parse(raw);
const we = Object.keys(e).filter((k) => k.startsWith('(WE)'));

const PROBLEMS = new Set([
  '(WE) Help me, あーりん！', '(WE) Oshama Scramble!', '(WE) あねぺったん', '(WE) 檄!帝国華撃団',
  '(WE) Oshama Scramble! (Cranky Remix)', '(WE) 今ぞ♡崇め奉れ☆オマエらよ！！～姫の秘メタル渇望～',
  '(WE) イロドリミドリ杯花映塚全一決定戦公式テーマソング『ウソテイ』', '(WE) volcanic', '(WE) ロキ',
  '(WE) Fidget Dancer', '(WE) Memory of Beach', '(WE) 五等分の気持ち', '(WE) Nijirate Fanatics',
  '(WE) 砂漠のハンティングガール♡', '(WE) Trackless wilderness', '(WE) 音弾超人ゴリライザー',
  '(WE) Blue Noise', '(WE) Kattobi KEIKYU Rider', '(WE) ナイト・オブ・ナイツ', '(WE) Teriqma',
  '(WE) BLUE ZONE', '(WE) XL TECHNO -More Dance Remix-', '(WE) まっすぐ→→→ストリーム！',
  '(WE) Random', '(WE) 創世のコンツェルティーナ', '(WE) Satellite System ft.Diana Chiaki',
  '(WE) 4月1日でございました', '(WE) なにやってもうまくいかない', '(WE) モア！ジャンプ！モア！',
  '(WE) フリーフォール', '(WE) うまぴょい伝説', '(WE) タイムカプセル', '(WE) マツケンサンバⅡ',
  '(WE) Reverberate', '(WE) BRAND NEW STARS!! (ALKALOID ver.)', '(WE) GIGA BLOCK'.replace('BLOCK', 'BLAST'),
  '(WE) I Wanna', '(WE) Adverse Gaff', '(WE) Nyan Cat', '(WE) luminoid love PART2',
]);

const SET_RE = /^(First Step|ずっと、夏！|High Speed Set|Slow Speed Set|ハネリズム Set|clutter set|RANDOM|パズルゲーム Set|HORIZON Set|みぞれヤナギ Set|タオル Set|CRITICAL EX Set|CRITICAL JUSTICE CHALLENGE|UNLOCK CHALLENGE Collection|KING of Performai The \d+|1UM1N0U5 ep\.111)\s*(.*)$/;

function trHeader(h) {
  const out = [];
  for (const line0 of h.split('\n')) {
    const line = line0.trim();
    if (!line) continue;
    if (/^情報 Font Awesome fontawesome\.com -->$/.test(line)) continue;
    let m;
    if ((m = line.match(/^対応キャラ\s*(.+)$/))) {
      out.push('对应角色：' + m[1].replace(/\s*\*\d+\s*$/, '').trim());
      continue;
    }
    if ((m = line.match(/^(.*?)元前(マップ)?課題曲\s*\/\s*(.*?)元次(マップ)?課題曲\s*\*?\d*$/))) {
      out.push(m[1].replace(/\s*\*\d+\s*$/, '').trim() + ' 元前课题曲 / 元次课题曲');
      continue;
    }
    if ((m = line.match(/^(.*?)元前(マップ)?課題曲\s*\*?\d*$/))) {
      out.push(m[1].replace(/\s*\*\d+\s*$/, '').trim() + ' 元前课题曲');
      continue;
    }
    if ((m = line.match(/^(.*?)元次(マップ)?課題曲\s*\*?\d*$/))) {
      out.push(m[1].replace(/\s*\*\d+\s*$/, '').trim() + ' 元次课题曲');
      continue;
    }
    if ((m = line.match(SET_RE)) && /曲目/.test(m[2])) {
      out.push(m[1] + ' ' + m[2].replace(/(\d+)曲目/g, '第 $1 曲').replace(/\s+/g, ' ').trim());
      continue;
    }
    if ((m = line.match(/^「(.+?)」\s*大会最終課題曲\s*\*?\d*$/))) {
      out.push('「' + m[1] + '」大会最终课题曲');
      continue;
    }
    if (/^KING of Performai 歴代決勝楽曲リンク/.test(line)) {
      out.push('KING of Performai 历代决胜乐曲链接');
      continue;
    }
    out.push('@@UNHANDLED@@' + line);
  }
  return out.join('\n');
}

let copied = 0;
const unhandled = [];
const skipped = [];
for (const k of we) {
  if (PROBLEMS.has(k)) { skipped.push(k); continue; }
  const base = k.replace(/^\(WE\)\s*/, '');
  const b = e[base];
  if (!b) { skipped.push(k); continue; }
  const a = e[k];
  const ai = String(a.wiki_comment || '');
  const bi = String(b.wiki_comment || '');
  if (!bi) { skipped.push(k); continue; }
  const idx = ai.indexOf(bi);
  if (idx < 0) { skipped.push(k); continue; }
  const h = trHeader(ai.slice(0, idx));
  if (h.includes('@@UNHANDLED@@')) {
    unhandled.push(k + ' :: ' + h.split('\n').filter((x) => x.startsWith('@@')).join(' / '));
    continue;
  }
  a.wiki_comment_zh = (h ? h + '\n' : '') + String(b.wiki_comment_zh || '');
  a.origins_zh = b.origins_zh;
  a.titles_zh = b.titles_zh;
  copied += 1;
}

fs.writeFileSync(path, JSON.stringify(e, null, 1) + '\n', 'utf8');
console.log('copied:', copied, 'unhandled:', unhandled.length, 'skipped:', skipped.length);
unhandled.slice(0, 12).forEach((u) => console.log(u.slice(0, 200)));
