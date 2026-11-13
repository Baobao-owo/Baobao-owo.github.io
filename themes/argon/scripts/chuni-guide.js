// 曲目导览：用公开数据集生成静态页面
// 列表页 /chuni/ + 每首歌 /chuni/<slug>/ 详情页
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function slugOf(id) {
  const base = String(id)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const hash = crypto.createHash('md5').update(String(id)).digest('hex').slice(0, 6);
  return (base || 'song') + '-' + hash;
}

function dataOf(hexo) {
  const data = hexo.locals.get('data');
  return (data && data.chuni) || null;
}

hexo.extend.helper.register('chuni_slug', function (id) {
  return slugOf(id);
});

hexo.extend.generator.register('chuni_guide', function (locals) {
  const d = dataOf(hexo);
  if (!d || !Array.isArray(d.songs) || !d.songs.length) return [];

  const cfg = (hexo.locals.get('data') && hexo.locals.get('data').chuni_config) || hexo.locals.get('data').chuniCfg || {};
  const extra = (hexo.locals.get('data') && hexo.locals.get('data').chuni_extra) || {};
  const cnVersions = new Set((cfg && cfg.cn_versions) || []);

  const versionIndex = new Map(d.versions.map(function (v, i) { return [v.key, i]; }));
  const versionLabel = new Map(d.versions.map(function (v) { return [v.key, v.abbr]; }));

  const designerMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_designers) || {};
  const idMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_ids) || {};
  const previewMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_previews) || {};
  const confirmMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_confirm) || {};
  const ytMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_youtube) || {};
  const cnData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_cn) || {};
  const cnSongMap = cnData.songs || {};
  const removedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_removed) || {};
  const removedIds = new Set((removedData.matched || []).map(function (x) { return String(x.id); }));
  const cnRemovedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_cn_removed) || {};
  const weData = ((hexo.locals.get('data') && hexo.locals.get('data').chuni_we) || {}).songs || {};
  const weDeletedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_we_deleted) || {};
  const weDeletedSet = new Set((weDeletedData.songs || []).map(function (x) { return normTitle(x.title); }));
  const cnRemovedIds = new Set((cnRemovedData.matched || []).map(function (x) { return String(x.id); }));

  function normTitle(t) {
    return String(t)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\u3000]/g, '')
      .replace(/[\[\]【】()（）「」『』!！?？'’”"・:：;；,，.。~～\-—_]/g, '');
  }
  const DIFF_LETTER = { basic: 'B', advanced: 'A', expert: 'E', master: 'M', ultima: 'U' };

  // 从 wiki 的定数履历里取「国服 2027 当时」的定数
  function cnConstsOf(entry, cnMaxIdx) {
    const rows = (entry && (entry.history_expanded || (entry.history && entry.history.rows))) || [];
    if (!rows.length || cnMaxIdx < 0) return null;
    const header = rows[0];
    const col = {};
    header.forEach(function (h, i) { col[h] = i; });
    let bestIdx = -1;
    let bestRow = null;
    rows.slice(1).forEach(function (r) {
      const label = String(r[0] || '');
      const start = label.split(/[～~]/)[0].trim();
      if (!versionIndex.has(start)) return;
      const idx = versionIndex.get(start);
      if (idx <= cnMaxIdx && idx > bestIdx) {
        bestIdx = idx;
        bestRow = r;
      }
    });
    if (!bestRow) return null;
    const out = {};
    ['B', 'A', 'E', 'M'].forEach(function (l) {
      if (col[l] != null && bestRow[col[l]]) out[l] = bestRow[col[l]];
    });
    return out;
  }

  const songs = d.songs.map(function (s, i) {
    const extraEntry = extra[String(s.id)] || extra[String(s.title).trim()] || {};
    const cnMaxIdx = Math.max.apply(null, Array.from(cnVersions).map(function (v) { return versionIndex.has(v) ? versionIndex.get(v) : -1; }).concat([-1]));
    const cnEntry = cnSongMap[normTitle(s.title)] || null;
    let cnConsts = null;
    if (cnEntry && cnEntry.d) {
      cnConsts = {};
      Object.keys(cnEntry.d).forEach(function (l) {
        const v = cnEntry.d[l] && cnEntry.d[l].v;
        if (v != null) cnConsts[l] = v;
      });
    }
    if (!cnConsts) cnConsts = cnConstsOf(extraEntry, cnMaxIdx);
    const fromMaster = designerMap[String(s.title).trim()] || {};
    const enriched = Object.assign({}, s, {
      musicId: idMap[String(s.title).trim()] || '',
      sheets: s.sheets.map(function (sh) {
        const letter = DIFF_LETTER[sh.difficulty];
        const masterDesigner = fromMaster[letter];
        return Object.assign({}, sh, {
          designer: masterDesigner || sh.designer || ''
        });
      })
    });
    const levels = enriched.sheets.map(function (sh) {
      return Number(sh.internalValue);
    }).filter(function (n) { return !isNaN(n); });
    const isWE = (enriched.sheets || []).length && enriched.sheets.every(function (sh) { return /^【.*】$/.test(sh.difficulty); });
    const weInfo = isWE ? (weData[String(enriched.title).trim()] || null) : null;
    if (weInfo) {
      enriched.weInfo = weInfo;
      enriched.sheets = enriched.sheets.map(function (sh) {
        if (!/^【.*】$/.test(sh.difficulty)) return sh;
        return Object.assign({}, sh, {
          attr: sh.difficulty,
          level: '☆' + (weInfo.stars || 1),
          designer: weInfo.designer || sh.designer || ''
        });
      });
    }
    const musicId = enriched.musicId;
    const previews = [];
    if (musicId) {
      for (let si = 0; si < enriched.sheets.length; si++) {
        const chartIdx = /^【.*】$/.test(String(enriched.sheets[si].difficulty)) ? 5 : si;
        const manifestKey = musicId + '_' + chartIdx;
        if (previewMap[manifestKey]) {
          previews[si] = previewMap[manifestKey];
          continue;
        }
        const exts = ['.webp', '.png', '.svg'];
        for (let ei = 0; ei < exts.length; ei++) {
          const rel = 'assets/chuni/preview/' + musicId + '_' + chartIdx + exts[ei];
          if (fs.existsSync(path.join(hexo.base_dir, 'source', rel))) {
            previews[si] = '/' + rel;
            break;
          }
        }
      }
    }
    enriched.previews = previews;
    enriched.confirms = confirmMap[String(s.title).trim()] || {};
    enriched.youtube = ytMap[String(s.title).trim()] || {};
    return {
      raw: enriched,
      slug: slugOf(s.id),
      sortIndex: i,
      versionIndex: versionIndex.has(s.version) ? versionIndex.get(s.version) : 0,
      versionLabel: versionLabel.get(s.version) || s.version,
      maxLevel: levels.length ? Math.max.apply(null, levels) : 0,
      minLevel: levels.length ? Math.min.apply(null, levels) : 0,
      inCN: cnEntry ? true : (Object.keys(cnSongMap).length ? false : cnVersions.has(s.version)),
      removed: removedIds.has(String(s.id)) || ((s.sheets || []).length > 0 && s.sheets.every(function (sh) { return /^【.*】$/.test(String(sh.difficulty)); }) && weDeletedSet.has(normTitle(s.title))),
      cnRemoved: cnRemovedIds.has(String(s.id)) && !cnEntry,
      cnConsts: cnConsts,
      cover: s.cover || ''
    };
  });

  const routes = [];

  // 给列表页用的精简数据（前端分页渲染）
  const compact = songs.map(function (e) {
    return {
      u: '/chuni/' + e.slug + '/',
      t: e.raw.title,
      a: e.raw.artist,
      c: e.raw.category,
      v: e.raw.version,
      b: e.raw.bpm,
      cov: e.cover,
      min: e.minLevel,
      max: e.maxLevel,
      cn: e.inCN ? 1 : 0,
      rm: e.removed ? 1 : 0,
      cnrm: e.cnRemoved ? 1 : 0,
      we: (function () {
        var stars = [];
        (e.raw.sheets || []).forEach(function (sh) {
          if (sh.difficulty && /^【.*】$/.test(sh.difficulty)) {
            var lv = String(sh.level || '');
            var m = lv.match(/☆(\d+)/);
            var n = m ? Number(m[1]) : (lv.match(/☆/g) || []).length || 1;
            stars.push(n);
          }
        });
        return stars;
      })(),
      weAttr: (function () {
        var hit = (e.raw.sheets || []).find(function (sh) { return /^【.*】$/.test(String(sh.difficulty)); });
        return hit ? String(hit.difficulty).replace(/[【】]/g, '') : '';
      })(),
      sh: e.raw.sheets.map(function (sh) {
        const letter = DIFF_LETTER[sh.difficulty];
        const cnVal = e.cnConsts && e.cnConsts[letter] != null ? Number(e.cnConsts[letter]) : null;
        return { d: sh.difficulty, lv: sh.level, iv: Number(sh.internalValue), cn: isNaN(cnVal) || cnVal == null ? null : cnVal };
      })
    };
  });
  hexo.route.set('chuni-songs.json', JSON.stringify(compact));

  routes.push({
    path: 'chuni/index.html',
    layout: 'chuni-list',
    data: {
      chuniKind: 'list',
      title: '曲目导览',
      guide: {
        updated: d.updated,
        source: d.source,
        versions: d.versions,
        categories: d.categories,
        songs: songs
      }
    }
  });

  songs.forEach(function (entry) {
    routes.push({
      path: 'chuni/' + entry.slug + '/index.html',
      layout: 'chuni-song',
      data: {
        chuniKind: 'song',
        title: entry.raw.title,
        song: entry.raw,
        slug: entry.slug,
        versionLabel: entry.versionLabel,
        guide: { updated: d.updated, categories: d.categories, versions: d.versions },
        extra: extra[entry.raw.id] || null
      }
    });
  });

  routes.push({
    path: 'categories/中二节奏/index.html',
    layout: 'chuni-landing',
    data: { chuniKind: 'landing', title: '中二节奏' }
  });

  return routes;
});
