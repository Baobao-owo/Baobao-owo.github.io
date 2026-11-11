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

function categoryList() {
  const data = hexo.locals.get ? hexo.locals.get('data') : null;
  return (data && data.categories && data.categories.categories) || [];
}

function configuredChildren(name) {
  const hit = categoryList().find(function (c) { return c && String(c.name) === String(name); });
  const kids = (hit && hit.children) || [];
  return kids
    .map(function (k) {
      if (typeof k === 'string') return { name: k, description: '' };
      return { name: String(k.name), description: k.description || '' };
    })
    .filter(function (k) { return k.name; });
}

// 分类（板块）的排序和简介，交给首页模板用
hexo.extend.helper.register('cat_meta', function (name) {
  const hit = categoryList().find(function (c) { return c && String(c.name) === String(name); });
  if (!hit) return { order: 999, description: '' };
  return {
    order: hit.order === undefined || hit.order === null ? 999 : Number(hit.order),
    description: hit.description || ''
  };
});

// 配置里声明的全部分类（包括还没有文章的），首页用来占位
hexo.extend.helper.register('configured_categories', function () {
  return categoryList()
    .filter(function (c) { return c && c.name; })
    .map(function (c) {
      return {
        name: String(c.name),
        order: c.order === undefined || c.order === null ? 999 : Number(c.order),
        description: c.description || ''
      };
    });
});

// 某个分类的子分类列表，统一成 { name, description }
hexo.extend.helper.register('category_children', function (name) {
  return configuredChildren(name);
});

// 这个分类是不是「带子分类的板块」（首页点进去先看子分类的那种）
hexo.extend.helper.register('is_board_with_children', function (name) {
  if (!name) return false;
  return configuredChildren(name).length > 0;
});

// 这个分类名是不是「谱面记录」板块里的（父分类本身或它的子分类）
hexo.extend.helper.register('is_chart_board', function (name) {
  if (!name) return false;
  const board = categoryList().find(function (c) { return c && c.children && c.children.length; });
  if (!board) return false;
  if (String(board.name) === String(name)) return true;
  return configuredChildren(board.name).some(function (k) { return String(k.name) === String(name); });
});

// 谱面记录板块的父分类名
hexo.extend.helper.register('chart_board_name', function () {
  const board = categoryList().find(function (c) { return c && c.children && c.children.length; });
  return board ? String(board.name) : '';
});

// 分类的自定义版式（categories.yml 里的 style 字段）
hexo.extend.helper.register('category_style', function (name) {
  const hit = categoryList().find(function (c) { return c && String(c.name) === String(name); });
  return (hit && hit.style) || '';
});

// 给自定义 CSS 加版本号，改完样式不用手动清缓存
hexo.extend.helper.register('asset_version', function () {
  try {
    const crypto = require('crypto');
    const fs = require('fs');
    const path = require('path');
    const file = path.join(hexo.base_dir, 'source/assets/css/baobao.css');
    return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
  } catch (e) {
    return 'dev';
  }
});