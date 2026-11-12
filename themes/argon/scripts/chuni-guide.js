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
  const DIFF_LETTER = { basic: 'B', advanced: 'A', expert: 'E', master: 'M', ultima: 'U' };

  const songs = d.songs.map(function (s, i) {
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
    const musicId = enriched.musicId;
    const previews = [];
    if (musicId) {
      for (let si = 0; si < enriched.sheets.length; si++) {
        const manifestKey = musicId + '_' + si;
        if (previewMap[manifestKey]) {
          previews[si] = previewMap[manifestKey];
          continue;
        }
        const exts = ['.webp', '.png', '.svg'];
        for (let ei = 0; ei < exts.length; ei++) {
          const rel = 'assets/chuni/preview/' + musicId + '_' + si + exts[ei];
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
      inCN: cnVersions.has(s.version),
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
      sh: e.raw.sheets.map(function (sh) {
        return { d: sh.difficulty, lv: sh.level };
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
