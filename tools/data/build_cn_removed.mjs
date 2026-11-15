// 把 lxns 版本快照里「国服曾出现、现在没有」的歌，匹配到我们的曲库
import fs from 'node:fs';

const guide = JSON.parse(fs.readFileSync('source/_data/chuni.json', 'utf8'));
const deleted = JSON.parse(fs.readFileSync('_tmp/cn-deleted.json', 'utf8'));

function norm(t) {
  return String(t)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[\[\]【】()（）「」『』!！?？'"“”‘’・:：;；,，.。~～\-—_]/g, '');
}

const ours = new Map();
for (const s of guide.songs) ours.set(norm(s.title), s);

const matched = [];
const unmatched = [];
for (const t of deleted) {
  const s = ours.get(norm(t));
  if (s) matched.push({ title: s.title, id: s.id, version: s.version });
  else unmatched.push(t);
}

const out = {
  source: 'maimai.lxns.net 版本快照对比',
  note: '国服历史版本里出现过、当前列表没有的曲目（覆盖 NEW 之后的快照）',
  total: deleted.length,
  matched,
  unmatched
};
fs.writeFileSync('source/_data/chuni_cn_removed.json', JSON.stringify(out, null, 1), 'utf8');
console.log('删除曲', deleted.length, '| 匹配到曲库', matched.length, '| 未匹配', unmatched.length);
console.log('未匹配示例:', unmatched.slice(0, 8).join(' | '));
