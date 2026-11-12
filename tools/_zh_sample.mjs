import fs from 'node:fs';
import path from 'node:path';

const p = path.join(process.cwd(), 'source/_data/chuni_extra.json');
const extra = JSON.parse(fs.readFileSync(p, 'utf8'));

const key = '初音ミクの消失';
const e = extra[key] || (extra[key] = {});

e.wiki_extra_zh = [
  '【定数变更履历】',
  '版本 | B | A | E | M',
  'AIR～AMAZON | 5 | 8 | 12 | 13',
  'AMAZON+～PARADISE× | 5 | 8 | 11+ | 13',
  'NEW～ | 5 | 8 | 12 | 14+',
  '※ NEW 前后的变化考虑到难度细分化，只把实质性的升降用红/蓝标出。',
  'EXP 定数 【12.0(AIR～AMAZON)、11.9(AMAZON+～PARADISE×)、12.0(NEW～)】',
  'MAS 定数 【13.6(AIR)、13.4(AIR+～PARADISE×)、14.5(NEW～)】',
  '',
  '【可获得称号】',
  '称号 | 条件',
  '---深刻なエラーが発生しました---（发生了严重的错误） | 触发危险技能',
  '',
  '【ND 名义与称号由来】',
  '- ND 名义（MAS）「如月ゆかりの消失」（如月 ゆかり）：曲名的戏仿。',
  '- 称号「---深刻なエラーが発生しました---」：出自歌词。'
].join('\n');

fs.writeFileSync(p, JSON.stringify(extra, null, 1), 'utf8');
console.log('added manual zh for extra sections:', key);
