// 列表卡片整块可点：点卡片任意位置都进文章（点标签/按钮之类除外）
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var SELECTOR = 'article.post.card:not(.post-full)';

    function titleLink(card) {
      return card.querySelector('a.post-title');
    }

    function isInteractive(el) {
      while (el && el !== document.body) {
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'INPUT') return true;
        el = el.parentElement;
      }
      return false;
    }

    function selectionActive() {
      var s = window.getSelection ? window.getSelection() : null;
      return !!(s && String(s).length > 0);
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var card = e.target.closest ? e.target.closest(SELECTOR) : null;
      if (!card) return;
      if (isInteractive(e.target)) return;
      if (selectionActive()) return;
      var a = titleLink(card);
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      window.location.href = href;
    });

    // 让卡片显出手型，同时保持正文文字的正常光标
    var style = document.createElement('style');
    style.textContent = SELECTOR + '{cursor:pointer}';
    document.head.appendChild(style);
  });
})();
