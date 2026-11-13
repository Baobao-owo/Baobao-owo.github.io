// 站点里不生成「归档」页面：路由生成后直接移除（文章本身仍在仓库里）
hexo.extend.filter.register('after_generate', function () {
  var routes = hexo.route.list().filter(function (p) {
    return p === 'archives/index.html' || p.indexOf('archives/') === 0;
  });
  routes.forEach(function (p) {
    hexo.route.remove(p);
  });
});
