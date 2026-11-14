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
  // 版本显示名：官方缩写里的 VERSE+ / VERSE++ 容易被误读，直接用 X-VERSE / X-VERSE-X
const VERSION_LABEL_FIX = { 'VERSE+': 'X-VERSE', 'VERSE++': 'X-VERSE-X' };
const versionLabel = new Map(d.versions.map(function (v) {
  return [v.key, VERSION_LABEL_FIX[v.abbr] || v.abbr];
}));

  const designerMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_designers) || {};
  const designerFill = (hexo.locals.get('data') && hexo.locals.get('data').chuni_designer_fill) || {};
  const idMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_ids) || {};
  const previewMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_previews) || {};
  const confirmMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_confirm) || {};
  const ytMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_youtube) || {};
  const notesMap = (hexo.locals.get('data') && hexo.locals.get('data').chuni_notes) || {};
  const designerAlias = (hexo.locals.get('data') && hexo.locals.get('data').chuni_designer_alias) || {};
  // 合作曲分工表（wiki 曲目页的「担当箇所 / 担当ND」）
  const collabParts = (hexo.locals.get('data') && hexo.locals.get('data').collab_parts) || {};
  const collabSongs = (function () {
    try {
      const f = hexo.base_dir + 'source/assets/data/collab.json';
      return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')).songs || {}) : {};
    } catch (e) { return {}; }
  })();
  function collabPeopleCount(title) {
    const key = String(title || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const rec = collabSongs[key];
    if (!rec) return 0;
    const ppl = new Set();
    ['b', 'a', 'e', 'm', 'u'].forEach(function (d) { (rec[d] || []).forEach(function (x) { ppl.add(x); }); });
    return ppl.size;
  }
  // 别名拆出来的成员，只有「原署名里看不出来」才值得显示
  function memberNote(rawName) {
    const mapped = DESIGNER_ALIAS[rawName];
    if (!mapped || mapped.indexOf(' × ') === -1) return '';
    const norm = function (x) { return String(x || '').normalize('NFKC').toLowerCase().replace(/[\s\u3000]/g, ''); };
    const base = norm(rawName);
    const tokens = mapped.split(' × ').map(function (x) { return x.trim(); }).filter(Boolean);
    const unseen = tokens.filter(function (t) { return base.indexOf(norm(t)) === -1; });
    return unseen.length ? mapped : '';
  }
  // 谱师索引（用于判断某张谱的作者是否「已知」）
  const DESIGNER_IDX = (function () {
    try {
      const f = hexo.base_dir + 'source/assets/data/designers.json';
      if (!fs.existsSync(f)) return { songs: {}, names: new Set() };
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      // 索引再按本项目的 normTitle 建一份，避免标点差异对不上
      const songs = {};
      Object.keys(d.songs || {}).forEach(function (k) {
        const nk = normTitle(k);
        if (!songs[nk]) songs[nk] = d.songs[k];
      });
      return { songs: songs, names: new Set((d.designers || []).map(function (x) { return x.name; })) };
    } catch (e) { return { songs: {}, names: new Set() }; }
  })();
  const DESIGNER_FIX = (hexo.locals.get('data') && hexo.locals.get('data').chuni_designer_fix) || {};
  const DESIGNER_ALIAS = (function () {
    try {
      const f = hexo.base_dir + 'source/_data/chuni_designer_alias.json';
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
    } catch (e) { return {}; }
  })();
  // 作者「已知」：署名本身就是谱师名，或者能在别名表里归到某个谱师
  function isKnownDesigner(title, letter) {
    const rec = DESIGNER_IDX.songs[normTitle(title)];
    if (!rec || !letter) return false;
    const x = rec[String(letter).toLowerCase()];
    if (!x) return false;
    const raw = String(x.raw || '').trim();
    if (!raw) return false;
    if (DESIGNER_IDX.names.has(raw)) return true;
    const mapped = DESIGNER_ALIAS[raw];
    return !!(mapped && DESIGNER_IDX.names.has(mapped));
  }

  // 「合作谱」判定：collab 数据里有 / 署名带双人分隔符 / 署名是团队名义
  const looseNames = (function () {
    try {
      const f = hexo.base_dir + 'source/assets/data/designers.json';
      if (!fs.existsSync(f)) return new Set();
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      return new Set((d.loose || []).map(function (x) { return String(x.name).toLowerCase(); }));
    } catch (e) { return new Set(); }
  })();
  const COLLAB_SEP = /\s*(?:&|＆|\bVS\b|\bvs\b|×|＋)\s*/;
  // docx（谱师学ep0.5）里列过的曲目一律算合作曲
  const collabDocxSet = new Set(((hexo.locals.get('data') && hexo.locals.get('data').collab_docx_titles) || []).map(function (t) { return normTitle(t); }));
  // 用户确认是单人写、但 docx 里列过的曲目
  const COLLAB_EXCLUDE = new Set((function () {
      const base = ['[改]Oshama Scramble!', 'タイムカプセル'];
      try {
        const p = path.join(hexo.base_dir, 'tools/collab-exclude.json');
        if (fs.existsSync(p)) {
          const extra = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (Array.isArray(extra)) extra.forEach(function (t) { base.push(String(t)); });
        }
      } catch (e) {}
      return base.map(normTitle);
    })());
  function isCollabSong(title, sheets) {
    if (COLLAB_EXCLUDE.has(normTitle(title))) return false;
    if (collabDocxSet.has(normTitle(title))) return true;
    if (collabPeopleCount(title) >= 2) return true;
    return (sheets || []).some(function (sh) {
      const d = String(sh.designer || '')
        // 去掉【】/[]/（）里的修饰再判断：「[O.N.×STAGE!]ミニミライト」是单人
        .replace(/【[^】]*】|\[[^\]]*\]|（[^）]*）|\([^)]*\)/g, '')
        .trim();
      if (!d) return false;
      if (COLLAB_SEP.test(d)) return true;
      return looseNames.has(d.toLowerCase());
    });
  }

  // 大合作：有 wiki 分工表，或者 3 人以上联名
  var partNormList = null;
  function isBigCollab(title) {
    // 有 wiki 分工表的，或者 3 人以上联名
    var t = normTitle(title);
    if (partsByNorm[t]) return true;
    if (!partNormList) partNormList = Object.keys(partsByNorm);
    // 分工表的标题常是简称（Caliburne / LAMIA），用互相包含来判断
    for (var i = 0; i < partNormList.length; i++) {
      var pn = partNormList[i];
      // 只认「开头互相包含」，避免 No.1 这种短名误伤
      if (pn.length >= 5 && t.indexOf(pn) === 0) return true;
      if (t.length >= 9 && pn.indexOf(t) === 0) return true;
    }
    return collabPeopleCount(title) >= 3;
  }
  const cnData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_cn) || {};
  const cnSongMap = cnData.songs || {};
  const removedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_removed) || {};
  const removedIds = new Set((removedData.matched || []).map(function (x) { return String(x.id); }));
  const cnRemovedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_cn_removed) || {};
  const weData = ((hexo.locals.get('data') && hexo.locals.get('data').chuni_we) || {}).songs || {};
  const weDeletedData = (hexo.locals.get('data') && hexo.locals.get('data').chuni_we_deleted) || {};
  const weDeletedSet = new Set((weDeletedData.songs || []).map(function (x) { return normTitle(x.title); }));
  const cnRemovedIds = new Set((cnRemovedData.matched || []).map(function (x) { return String(x.id); }));
  // 补录的删除曲（wiki 配信終了 + 本地游戏数据封面）
  const removedSongs = (hexo.locals.get('data') && hexo.locals.get('data').chuni_removed_songs) || [];  (Array.isArray(removedSongs) ? removedSongs : []).forEach(function (s) {
    removedIds.add(String(s.id));
  });

  // 合作分工表按 normTitle 建索引（和前端/数据里的写法保持一致）
  const partsByNorm = (function () {
    const m = {};
    Object.keys(collabParts).forEach(function (k) {
      const p = collabParts[k];
      if (p && p.title) m[normTitle(p.title)] = p;
    });
    return m;
  })();
  function partsOf(title) {
    return partsByNorm[normTitle(title)] || null;
  }
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

  const allSongs = d.songs.concat(Array.isArray(removedSongs) ? removedSongs : []);
  const songs = allSongs.map(function (s, i) {
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
    const fromFill = designerFill[String(s.title).trim()] || {};
    const enriched = Object.assign({}, s, {
      musicId: idMap[String(s.title).trim()] || '',
      sheets: s.sheets.map(function (sh) {
        const letter = DIFF_LETTER[sh.difficulty];
        const masterDesigner = fromMaster[letter];
        // 谱师栏保留游戏内原文（不过滤、不合并别名）
        const cur = String(sh.designer || '').trim();
        let name = (cur && cur !== '-') ? cur : (fromFill[letter] || '');
        const fixKey = String(s.title).trim() + '::' + String(sh.difficulty).toLowerCase();
        const fixVal = (DESIGNER_FIX.overrides || {})[fixKey];
        if (typeof fixVal === 'string') name = fixVal;
        const mem = name ? memberNote(name) : '';
        return Object.assign({}, sh, {
          designer: name,
          mem: mem
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

  // wiki 逐曲页面的「解禁方法」里抽出来的首次配信日期
  const songDates = (function () {
    try {
      const p = path.join(hexo.base_dir, 'tools/song-dates.json');
      if (!fs.existsSync(p)) return {};
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      const m = {};
      for (const k of Object.keys(raw)) {
        const key = String(k).normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
        m[key] = raw[k];
      }
      return m;
    } catch (err) {
      return {};
    }
  })();

  // wiki「楽曲一覧(追加日順)」：曲名 -> 追加日 + 页面顺序
  const addOrder = (function () {
    try {
      const p = path.join(hexo.base_dir, 'tools/song-addorder.json');
      if (!fs.existsSync(p)) return {};
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      const m = {};
      for (const k of Object.keys(raw)) {
        const key = String(k).normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
        m[key] = raw[k];
      }
      return m;
    } catch (err) {
      return {};
    }
  })();

  // 给列表页用的精简数据（前端分页渲染）
  const compact = songs.map(function (e) {
    return {
      u: '/chuni/' + e.slug + '/',
      t: e.raw.title,
      a: e.raw.artist,
      c: e.raw.category,
      v: e.raw.version,
      // 追加日（用来在同一个版本内按上线顺序排）
      // wiki「楽曲一覧(追加日順)」收录了的优先用它，新曲日期更准
      rel: (function () {
        const key = String(e.raw.title || '')
          .normalize('NFKC')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const w = addOrder[key];
        if (w && w.date) {
          const wm = String(w.date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (wm) {
            const dnum = Number(wm[1]) * 10000 + Number(wm[2]) * 100 + Number(wm[3]);
            // 同一天内按 wiki 页面顺序（越靠前越新）
            return dnum * 1000 + (1000 - (Number(w.order) || 0));
          }
        }
        // 其次用「解禁方法」里的首次配信日期（wiki 逐曲页面，覆盖 1900+ 首）
        const wd = songDates[key];
        if (wd) {
          const dm2 = String(wd).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (dm2) return (Number(dm2[1]) * 10000 + Number(dm2[2]) * 100 + Number(dm2[3])) * 1000;
        }
        const t = String(e.raw.release || '');
        const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        return m ? (Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3])) * 1000 : 0;
      })(),
      b: e.raw.bpm,
      cov: e.cover,
      min: e.minLevel,
      max: e.maxLevel,
      cn: e.inCN ? 1 : 0,
      rm: e.removed ? 1 : 0,
      big: isBigCollab(e.raw.title) ? 1 : 0,
      cl: isCollabSong(e.raw.title, e.raw.sheets) ? 1 : 0,
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
        const known = isKnownDesigner(e.raw.title, letter) ? 1 : 0;
        const cnVal = e.cnConsts && e.cnConsts[letter] != null ? Number(e.cnConsts[letter]) : null;
        const rawName = String(sh.designer || '').trim();
        const memName = rawName ? memberNote(rawName) : '';
        return { d: sh.difficulty, lv: sh.level, iv: Number(sh.internalValue), cn: isNaN(cnVal) || cnVal == null ? null : cnVal, ds: sh.designer || '', kn: known, mem: memName };
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
        extra: extra[entry.raw.id] || extra[String(entry.raw.title).trim()] || null,
        notes: notesMap[String(entry.raw.title).trim()] || null,
        collabParts: partsOf(entry.raw.title)
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
