/* 后台预览：照站点文章页和列表卡片的样子渲染（用 Decap 自己的 h / createClass） */
(function () {
  if (typeof window.CMS === 'undefined' || typeof CMS.registerPreviewTemplate !== 'function') return;
  if (typeof window.h !== 'function' || typeof window.createClass !== 'function') return;
  if (window.__baobaoPreviewReady) return;

  var h = window.h;
  var createClass = window.createClass;

  function str(v) {
    return v === undefined || v === null ? '' : String(v);
  }

  function list(v) {
    if (!v) return [];
    if (v.toJS) return v.toJS();
    if (Array.isArray(v)) return v;
    return [v];
  }

  function dateOf(v) {
    var s = str(v);
    return s ? s.slice(0, 10) : '';
  }

  function coverOf(data) {
    if (data.chuni && data.chuni.cover) return data.chuni.cover;
    var map = data.map || {};
    if (map.cover) return map.cover;
    if (map.set_id) return 'https://assets.ppy.sh/beatmaps/' + map.set_id + '/covers/cover.jpg';
    return '';
  }

  function diffsOf(map) {
    var diffs = (map && map.diffs) || [];
    return diffs.filter(function (d) {
      return d && (d.name || d.cls || d.value);
    });
  }

  function srSummary(map) {
    var srs = diffsOf(map)
      .map(function (d) {
        return Number(d.sr);
      })
      .filter(function (n) {
        return !isNaN(n) && n > 0;
      });
    if (!srs.length) return '';
    var min = Math.min.apply(null, srs);
    var max = Math.max.apply(null, srs);
    return min === max ? min.toFixed(2) : min.toFixed(2) + '–' + max.toFixed(2);
  }

  var Card = createClass({
    render: function () {
      var d = this.props.data || {};
      var cover = coverOf(d);
      var map = d.map || {};
      var chuni = d.chuni || {};
      var isChuni = !!(chuni.diffs && chuni.diffs.length);
      var diffs = diffsOf(map);
      var chips = (chuni.diffs || []).filter(function (x) {
        return x && (x.cls || x.value);
      });

      var coverStyle = cover
        ? { backgroundImage: "url('" + cover + "')" }
        : { background: 'linear-gradient(150deg,#dbe7f0,#c3d6e4)' };

      var lines = [];
      if (isChuni) {
        lines.push(
          h(
            'div',
            { className: 'pv-line', key: 'chips' },
            chips.map(function (c, i) {
              return h('span', { className: 'pv-chip', key: i }, c.cls === '速' ? '速 ' + str(c.value) : str(c.cls || c.value));
            })
          )
        );
      } else if (diffs.length) {
        lines.push(
          h(
            'div',
            { className: 'pv-line', key: 'sr' },
            h('span', { className: 'pv-diff' }, diffs.length + ' 个难度'),
            srSummary(map) ? h('span', { className: 'pv-sr' }, '★ ' + srSummary(map)) : null
          )
        );
      }

      var status = map.status || '';
      return h(
        'div',
        { className: 'pv-card' },
        h(
          'div',
          { className: 'pv-cover', style: coverStyle },
          status ? h('span', { className: 'pv-status' }, status) : null
        ),
        h(
          'div',
          { className: 'pv-body' },
          h('div', { className: 'pv-title' }, str(d.title) || '未命名'),
          (isChuni ? str(chuni.artist) : str(map.artist)) ? h('div', { className: 'pv-artist' }, str(isChuni ? chuni.artist : map.artist)) : null,
          lines,
          h('div', { className: 'pv-date' }, dateOf(d.date))
        )
      );
    }
  });

  var Post = createClass({
    render: function () {
      var entry = this.props.entry;
      var data = {};
      try {
        data = entry && entry.get ? entry.get('data').toJS() : {};
      } catch (e) {
        data = {};
      }
      var map = data.map || {};
      var chuni = data.chuni || {};
      var cats = list(entry && entry.get ? entry.getIn(['data', 'categories']) : null);
      var body = str(data.body);

      var mapBlock = null;
      if (map && (map.set_id || diffsOf(map).length)) {
        var diffs = diffsOf(map);
        mapBlock = h(
          'div',
          { className: 'pv-info' },
          coverOf(data) ? h('div', { className: 'pv-info-cover', style: { backgroundImage: "url('" + coverOf(data) + "')" } }) : null,
          h(
            'div',
            { className: 'pv-info-body' },
            h('h3', { className: 'pv-info-title' }, str(data.title)),
            h('div', { className: 'pv-info-artist' }, str(map.artist) + (map.mapper ? ' · 谱师 ' + str(map.mapper) : '') + (map.status ? ' · ' + str(map.status) : '')),
            diffs.length
              ? h(
                  'div',
                  { className: 'pv-diffs' },
                  diffs.map(function (x, i) {
                    return h(
                      'span',
                      { className: 'pv-diff-btn' + (String(x.id) === String(map.beatmap_id) ? ' active' : ''), key: i },
                      h('span', { className: 'pv-diff-name' }, str(x.name)),
                      x.sr ? h('span', { className: 'pv-diff-sr' }, '★ ' + str(x.sr)) : null
                    );
                  })
                )
              : null
          )
        );
      }

      var chuniBlock = null;
      if (chuni && (chuni.diffs || chuni.artist)) {
        var cdiffs = (chuni.diffs || []).filter(function (x) {
          return x && (x.cls || x.value);
        });
        chuniBlock = h(
          'div',
          { className: 'pv-info' },
          chuni.cover ? h('div', { className: 'pv-info-cover pv-info-cover-tall', style: { backgroundImage: "url('" + chuni.cover + "')" } }) : null,
          h(
            'div',
            { className: 'pv-info-body' },
            h('h3', { className: 'pv-info-title' }, str(data.title)),
            chuni.artist ? h('div', { className: 'pv-info-artist' }, str(chuni.artist)) : null,
            chuni.authors ? h('div', { className: 'pv-info-mapper' }, '谱师 ' + str(chuni.authors)) : null,
            cdiffs.length
              ? h(
                  'div',
                  { className: 'pv-diffs' },
                  cdiffs.map(function (x, i) {
                    return h(
                      'span',
                      { className: 'pv-diff-btn', key: i },
                      h('span', { className: 'pv-diff-name' }, x.cls === '速' ? '速' : str(x.cls)),
                      x.value ? h('span', { className: 'pv-diff-sr' }, str(x.value)) : null
                    );
                  })
                )
              : null,
            chuni.video_desc ? h('div', { className: 'pv-desc' }, str(chuni.video_desc)) : null,
            chuni.note ? h('div', { className: 'pv-note' }, str(chuni.note)) : null
          )
        );
      }

      return h(
        'div',
        { className: 'pv-page' },
        h(
          'div',
          { className: 'pv-section-label' },
          '列表卡片'
        ),
        h(Card, { data: data }),
        h('div', { className: 'pv-section-label' }, '文章页'),
        h(
          'div',
          { className: 'pv-article' },
          h('h1', { className: 'pv-article-title' }, str(data.title) || '未命名'),
          h(
            'div',
            { className: 'pv-meta' },
            (dateOf(data.date) ? dateOf(data.date) + '  ·  ' : '') + cats.join(' / ')
          ),
          mapBlock,
          chuniBlock,
          h('div', { className: 'pv-content', dangerouslySetInnerHTML: { __html: body } })
        )
      );
    }
  });

  try {
    CMS.registerPreviewTemplate('posts', Post);
    window.__baobaoPreviewReady = true;
    console.log('[preview] 已注册');
  } catch (e) {
    console.warn('[preview] 注册失败', e);
  }
})();
