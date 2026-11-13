// 粗算：每个会报页里有多少「■曲名 (难度)」块，能对上站内曲目的比例
import fs from 'node:fs';

const pages = [
  ['11th', 'chunithm-11th-report'],
  ['10th', 'chunithm-10th-report'],
  ['10th-greeting', 'chunithm-10th-greeting'],
  ['9th', 'chunithm-9th-report'],
  ['8th', 'chunithm-8th-report'],
  ['7th', 'chunithm-7th-report'],
  ['penguin-6', 'chunithm-penguin-secret-6'],
  ['penguin-5', 'chunithm-penguin-secret-5'],
  ['penguin-4', 'chunithm-penguin-secret-4'],
  ['penguin-3', 'chunithm-penguin-secret-3'],
  ['penguin-2', 'chunithm-penguin-secret-2'],
  ['penguin-1', 'chunithm-penguin-secret-1'],
];

const site = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const removed = JSON.parse(fs.readFileSync('source/_data/chuni_removed_songs.json', 'utf8'));

const norm = (s) =>
  String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'‘’“”"・:：;；,，.。~～\-–—_♣♠♥♦♡♢/\\|&]/g, '');

const siteTitles = new Set();
for (const s of site.songs) siteTitles.add(norm(s.title));
for (const s of removed) siteTitles.add(norm(s.title));

const stripTrans = (s) =>
  String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));

let totalBlocks = 0;
let matchedBlocks = 0;

for (const [label, file] of pages) {
  const p = `_tmp/nr_${file}.html`;
  if (!fs.existsSync(p)) {
    console.log(label, '（未下载）');
    continue;
  }
  const text = stripTrans(fs.readFileSync(p, 'utf8'));
  const blocks = text.split(/[■□]/).slice(1);
  let hit = 0;
  for (const b of blocks) {
    const head = b.split('\n')[0].trim();
    const title = head.replace(/\s*[（(][^（()）]*(?:EXPERT|MASTER|ULTIMA|BASIC|ADVANCED)[^（()）]*[)）]\s*$/i, '').trim();
    const key = norm(title.replace(/[（(].*$/, '').trim());
    if (key && [...siteTitles].some((t) => t && (key === t || key.includes(t) || t.includes(key)))) hit++;
  }
  totalBlocks += blocks.length;
  matchedBlocks += hit;
  console.log(`${label}: 块 ${blocks.length} | 粗匹配 ${hit}`);
}
console.log('合计块:', totalBlocks, '| 粗匹配:', matchedBlocks);
