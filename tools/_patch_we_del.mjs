import fs from 'node:fs';

const p = 'themes/argon/scripts/chuni-guide.js';
let t = fs.readFileSync(p, 'utf8');

if (!t.includes('weDeletedSet')) {
  t = t.replace(
    "  const weData = ((hexo.locals.get('data') && hexo.locals.get('data').chuni_we) || {}).songs || {};",
    `  const weData = ((hexo.locals.get('data') && hexo.locals.get('data').chuni_we) || {}).songs || {};
  const weDeletedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_we_deleted) || {};
  const weDeletedSet = new Set((weDeletedData.songs || []).map(function (x) { return normTitle(x.title); }));`
  );
}

// 标记：WE 曲且出现在「配信終了」名单里 → removed
if (!t.includes('weDeletedSet.has')) {
  t = t.replace(
    '      removed: removedIds.has(String(s.id)),',
    `      removed: removedIds.has(String(s.id)) || ((s.sheets || []).length > 0 && s.sheets.every(function (sh) { return /^【.*】$/.test(String(sh.difficulty)); }) && weDeletedSet.has(normTitle(s.title))),`
  );
}

fs.writeFileSync(p, t, 'utf8');
console.log('patched:', t.includes('weDeletedSet.has'), t.includes('weDeletedSet ='));
