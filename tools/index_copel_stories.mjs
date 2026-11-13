// 整理剧情站语料：生成分组索引，并抽取角色名补进术语表
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, '_tmp/refs/copel');
const idx = JSON.parse(fs.readFileSync(path.join(DIR, '_index.json'), 'utf8'));

const CATS = {
  penguin: '企鹅（制作组秘话 / Linked VERSE / 十周年）',
  irodorimidori: '彩绿（イロドリミドリ）',
  relation: '心连羁绊（relation）',
  metaverse: 'Metaverse（假想世界篇 / 地上篇）',
  seelicht: 'SeelischTact',
  animali: 'Animali',
  genesis: 'Genesis of Destiny',
  gumin: 'GUMIN',
  sibula: 'Sibula'
};

const groups = {};
for (const x of idx) {
  const cat = x.path.split('/')[1] || 'root';
  (groups[cat] = groups[cat] || []).push(x);
}

let md = '# copel-popn 剧情站索引（本地缓存）\n\n';
md += `来源：https://copel-popn.github.io （225 页，约 250 万字符，2026-11-13 抓取）\n\n`;
for (const [cat, list] of Object.entries(groups)) {
  md += `## ${CATS[cat] || cat}（${list.length} 页）\n\n`;
  for (const x of list.sort((a, b) => a.title.localeCompare(b.title))) {
    md += `- ${x.title} — \`${x.file}\`\n`;
  }
  md += '\n';
}
fs.writeFileSync(path.join(DIR, '_index.md'), md, 'utf8');
console.log('索引写入', md.length, '字符');

// 角色名（页面标题，排除 README / 索引）
const namePages = idx.filter(
  (x) =>
    !/README/i.test(x.path) &&
    !/unithm|10th/i.test(x.path) &&
    (x.path.startsWith('/relation/') ||
      x.path.startsWith('/irodorimidori/') ||
      x.path.startsWith('/metaverse/') ||
      x.path.startsWith('/seelicht/') ||
      x.path.startsWith('/genesis/') ||
      x.path.startsWith('/gumin/') ||
      x.path.startsWith('/sibula/') ||
      x.path.startsWith('/animali/'))
);
const names = [...new Set(namePages.map((x) => x.title))].filter((t) => t && t.length <= 12);
console.log('角色名候选:', names.length);
fs.writeFileSync(path.join(DIR, '_names.json'), JSON.stringify(names, null, 1), 'utf8');
console.log(names.slice(0, 30).join(' | '));
