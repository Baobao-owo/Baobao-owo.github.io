// 让 source/_data/site.yml 覆盖站点信息。
// 后台（Decap）只改这个小文件，不用碰 _config.yml 里那些注释和部署配置。
//
// 站点名这类直接改 hexo.config —— 模板里的 config 就是它。
// 封面标语、侧栏公告这两个原本在 argon.yml 里，
// 但主题会整个替换 hexo.theme.config，所以改成走 config 上的自定义键，
// 由 header.ejs / sidebar.ejs 优先读取（见那两处 site_banner_subtitle / site_announcement）。
hexo.on('generateBefore', function () {
  const data = hexo.locals.get ? hexo.locals.get('data') : null;
  const site = data && data.site;
  if (!site) return;

  const cfg = hexo.config;

  ['title', 'subtitle', 'description', 'keywords', 'author'].forEach(function (k) {
    if (site[k] !== undefined && site[k] !== null && site[k] !== '') {
      cfg[k] = site[k];
    }
  });

  if (site.banner_subtitle) cfg.site_banner_subtitle = site.banner_subtitle;
  if (site.banner_image) cfg.site_banner_image = site.banner_image;
  if (site.announcement) cfg.site_announcement = site.announcement;
});

// 分类（板块）的排序和简介，交给首页模板用
hexo.extend.helper.register('cat_meta', function (name) {
  const data = hexo.locals.get ? hexo.locals.get('data') : null;
  const list = (data && data.categories && data.categories.categories) || [];
  const hit = list.find(function (c) { return c && String(c.name) === String(name); });
  if (!hit) return { order: 999, description: '' };
  return {
    order: hit.order === undefined || hit.order === null ? 999 : Number(hit.order),
    description: hit.description || ''
  };
});

// 配置里声明的全部分类（包括还没有文章的），首页用来占位
hexo.extend.helper.register('configured_categories', function () {
  const data = hexo.locals.get ? hexo.locals.get('data') : null;
  const list = (data && data.categories && data.categories.categories) || [];
  return list
    .filter(function (c) { return c && c.name; })
    .map(function (c) {
      return {
        name: String(c.name),
        order: c.order === undefined || c.order === null ? 999 : Number(c.order),
        description: c.description || ''
      };
    });
});