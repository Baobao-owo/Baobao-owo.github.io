// 从谱师简介里提取「名義初登場 / 漢字表記 / 別名義」和备注，生成数据文件
import fs from 'node:fs';

const ROOT = process.cwd();
const all = JSON.parse(fs.readFileSync(ROOT + '/_tmp/designers-all.json', 'utf8'));

function pick(profile, key) {
  const line = profile.find((l) => l.startsWith(key));
  if (!line) return '';
  return line.slice(key.length).replace(/^[:：]\s*/, '').trim();
}

const out = [];
for (const d of all) {
  const aliases = [];
  const kanji = pick(d.profile, '漢字表記');
  const alias = pick(d.profile, '別名義');
  if (kanji) aliases.push(kanji);
  if (alias) alias.split(/[、,／\/]/).forEach((a) => a && aliases.push(a.replace(/\*\d+/g, '').trim()));
  const notes = d.profile.filter((l) => !/^(名義初登場|漢字表記|別名義)/.test(l)).slice(0, 8);
  out.push({
    name: d.name,
    firstWork: pick(d.profile, '名義初登場'),
    aliases,
    notes,
    source: d.source
  });
}

fs.writeFileSync(ROOT + '/source/_data/chuni_designers_info.json', JSON.stringify({ updated: new Date().toISOString().slice(0, 10), designers: out }, null, 1), 'utf8');
console.log('写入谱师:', out.length);
const withAlias = out.filter((d) => d.aliases.length);
console.log('带别名:', withAlias.length);
withAlias.slice(0, 10).forEach((d) => console.log(d.name, '=>', d.aliases.join(' / ')));
