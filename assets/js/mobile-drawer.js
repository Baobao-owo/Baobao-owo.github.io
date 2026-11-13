// 手机端：左侧抽屉导航（RINNET / 落雪那种）
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var isMobile = function () {
      return window.matchMedia('(max-width: 991px)').matches;
    };

    var collapse = document.getElementById('navbar_global');
    var toggler = document.querySelector('.navbar-toggler');
    if (!collapse) return;

    // 从主题菜单里收集链接
    var seen = {};
    var links = [];
    collapse.querySelectorAll('.navbar-nav a.nav-link, .navbar-nav a.dropdown-item').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var text = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || !href || href === '#') return;
      if (seen[href + text]) return;
      seen[href + text] = 1;
      links.push({ href: href, text: text });
    });

    var overlay = document.createElement('div');
    overlay.className = 'mnav-overlay';

    var drawer = document.createElement('aside');
    drawer.className = 'mnav-drawer';
    drawer.innerHTML =
      '<div class="mnav-head"><span class="mnav-title">FDShijing 的小站</span>' +
      '<button type="button" class="mnav-close" aria-label="关闭">×</button></div>' +
      '<nav class="mnav-links"></nav>' +
      '<div class="mnav-foot"><a href="https://space.bilibili.com/324184620" target="_blank" rel="noopener">Bilibili 主页 ↗</a></div>';

    var nav = drawer.querySelector('.mnav-links');
    links.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.text;
      nav.appendChild(a);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function open() {
      document.body.classList.add('mnav-open');
    }
    function close() {
      document.body.classList.remove('mnav-open');
    }

    overlay.addEventListener('click', close);
    drawer.querySelector('.mnav-close').addEventListener('click', close);
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // 接管左上角汉堡按钮
    document.addEventListener(
      'click',
      function (e) {
        var t = e.target.closest('.navbar-toggler');
        if (t && isMobile()) {
          e.preventDefault();
          e.stopPropagation();
          open();
        }
      },
      true
    );
  });
})();
