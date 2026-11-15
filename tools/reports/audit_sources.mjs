import fs from 'node:fs';
import path from 'node:path';

const read = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return null; } };
const rd = 'source/_data/';
const ad = 'source/assets/data/';

const chuni = read(rd + 'chuni.json');
const removed = read(rd + 'chuni_removed_songs.json');
const designers = read(rd + 'chuni_designers.json');
const alias = read(rd + 'chuni_designer_alias.json');
const notes = read(rd + 'chuni_notes.json');
const extra = read(rd + 'chuni_extra.json');
const previews = read(rd + 'chuni_previews.json');
const ids = read(rd + 'chuni_ids.json');
const fill = read(rd + 'chuni_designer_fill.json');
const fix = read(rd + 'chuni_designer_fix.json');
const cn = read(rd + 'chuni_cn.json');
const we = read(rd + 'chuni_we.json');
const weDel = read(rd + 'chuni_we_deleted.json');
const partsData = read(rd + 'collab_parts.json');
const partsAssets = read(ad + 'collab-parts.json');
const collab = read(ad + 'collab.json');
const designersList = read(ad + 'designers.json');
const docxTitles = read(rd + 'collab_docx_titles.json');
const c2s = read('_tmp/game/c2s-designers-all.json');

const num = (x) => Array.isArray(x) ? x.length : (x && typeof x === 'object' ? Object.keys(x).length : null);
console.log('songs', num(chuni), 'removed', num(removed), 'designers', num(designers), 'alias', num(alias), 'notes', num(notes), 'extra', num(extra), 'previews', num(previews), 'ids', num(ids));
console.log('fill', num(fill), 'fix', num(fix), 'cn', num(cn), 'we', num(we), 'weDel', num(weDel), 'docxTitles', num(docxTitles), 'c2s', num(c2s));
console.log('parts _data', num(partsData), 'parts assets', num(partsAssets), 'collab', num(collab), 'designersList', num(designersList));

// 版本分布
if (Array.isArray(chuni)) {
  const byVer = {};
  for (const s of chuni) byVer[s.version || '?'] = (byVer[s.version || '?'] || 0) + 1;
  console.log('versions:', Object.entries(byVer).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + '=' + v).join(', '));
  // 定数缺失
  let missIv = 0, missIn = 0, sheets = 0;
  for (const s of chuni) for (const sh of (s.sheets || [])) { sheets++; if (sh.internalValue == null || sh.internalValue === '') missIv++; if (!sh.internal) missIn++; }
  console.log('sheets', sheets, 'missing internalValue', missIv, 'missing internal', missIn);
  // 难度作者缺失
  let missDs = 0;
  for (const s of chuni) for (const sh of (s.sheets || [])) if (!sh.designer) missDs++;
  console.log('sheets missing designer', missDs);
  // 版本原值
  console.log('sample', JSON.stringify(chuni[0]).slice(0, 200));
}

// 定数源对照
const lxns = read('_tmp/lxns-songs.json');
const cdata = read('_tmp/chunithm-data.json');
console.log('lxns type', Array.isArray(lxns) ? 'array' : typeof lxns, num(lxns));
console.log('cdata type', Array.isArray(cdata) ? 'array' : typeof cdata, num(cdata));

// 删除曲数量
if (Array.isArray(removed)) {
  console.log('removed sample', JSON.stringify(removed[0]).slice(0, 200));
}
// we
if (Array.isArray(we)) console.log('we sample', JSON.stringify(we[0]).slice(0, 160));

// alias 冲突：同一 raw → 多个 canonical? 结构确认
const aliasKeys = Object.keys(alias || {});
console.log('alias sample', aliasKeys.slice(0, 5).map(k => k + ' => ' + JSON.stringify(alias[k]).slice(0, 80)).join(' | '));

// collab 结构
console.log('collab sample', JSON.stringify(Object.entries(collab || {})[0]).slice(0, 300));
console.log('parts sample', JSON.stringify(Object.entries(partsAssets || {})[0]).slice(0, 300));
