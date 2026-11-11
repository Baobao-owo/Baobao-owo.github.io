# 宝宝的小站

Hexo 8 + Argon 主题的个人博客。进站封面是一张插画，整站配色跟着它的冷蓝灰色调走。

## 快速开始

```bash
npm install        # 只有第一次需要
npm run dev        # 本地预览 http://127.0.0.1:4000
npm run build      # 生成静态文件到 public/
npm run clean      # 清缓存
```

## 写一篇新文章

```bash
npm run new -- "文章标题"
```

会在 `source/_posts/` 生成一个 md 文件，开头这段叫 front-matter：

```yaml
---
title: 文章标题
date: 2026-11-11 17:40:00
categories: 折腾
tags: [Hexo, 建站]
---
```

正文用 Markdown 写。`<!--more-->` 上面那部分是首页摘要。

## 改外观

- 站点名、副标题、作者、导航菜单：`_config.yml`
- 主题：`source/_data/argon.yml`
  - `theme_color` 主题色（冷钢蓝 `#4f7f9c`）
  - `banner_background_url` / `sidebar_auther_image` 封面图和头像
  - `toolbar_menu` 顶栏菜单
- 自定义样式：`source/assets/css/baobao.css`（封面的裁切位置、底部渐隐、代码块配色都在这）
- 首页板块：模板在 `themes/argon/layout/home.ejs`，按分类自动分块（外加一块「最新更新」），板块顺序跟着各分类最新文章走，每块最多列 5 篇；样式在 `baobao.css` 的 `home-sections` 那段
- 图片：`source/assets/img/`
  - `banner-euthanasia.jpg` 进站封面（1920×1234，295KB）
  - `avatar-flower.jpg` 头像（白玫瑰 + 蓝绣球那块）
  - `tools/make_cover.py` 可以重新导出封面、头像和 favicon

## 主题改动记录

主题直接放在 `themes/argon`，动过这几处：

- `layout/header.ejs`：去掉 fonts.loli.net 外链字体、去掉 busuanzi 访问统计、favicon 换成本地图、修了打字效果间隔读不到的 bug
- `layout/footer.ejs`：去掉 busuanzi 统计块
- `layout/archive.ejs`：重写（原文件里「归档」两个字是坏字节）
- 删掉主题自带的示例大图 `banner.jpg` / `auther.jpg` / `favicon.ico`（省 1.6MB）

以后升级主题，这几处要重新应用。

## 关于看板娘

以前挂过 live2d（shizuku 模型），后来去掉了，现在页面上没有。

想重新加回来：`npm i live2d-widget live2d-widget-model-shizuku`，把 `node_modules/live2d-widget/lib/` 和模型包里的 `assets/` 拷到 `source/assets/live2d/`，再在 `argon.yml` 的 `custom_html_foot` 里写一段 `L2Dwidget.init({...})`。

## 评论

用的是 giscus，评论存在仓库的 GitHub Discussions 里（类别 `Announcements`），不需要自己的服务器。

仓库上需要装一次 giscus App，不然评论框会提示没安装：
<https://github.com/apps/giscus/installations/new> → 选 `Baobao-owo.github.io` → Install。

配置在 `source/_data/argon.yml` 的 `giscus` 段，`repo_id` 和 `category_id` 已经填好了，改仓库或类别才需要动。
夜间模式靠 `custom_html_foot` 里那一小段脚本给评论框发主题。

## 网页后台

线上有 `/admin`（<https://baobao-owo.github.io/admin/>），Decap CMS + DecapBridge 登录，能改：

- **文章**、**页面**（关于）
- **站点设置**：站名、副标题、描述、关键词、作者、封面标语、侧栏公告、进站封面图
- **分类管理**：板块顺序、简介、改名（填「曾用名」，构建时自动把文章里的旧分类名换掉）

站点设置写的是 `source/_data/site.yml`，分类管理写的是 `source/_data/categories.yml`，都不会碰 `_config.yml` 里那些注释和部署配置。保存后 Actions 自动构建，一两分钟上线。

## 已经上线

线上地址：<https://baobao-owo.github.io/>
仓库：`Baobao-owo/Baobao-owo.github.io`（main 分支，GitHub Pages 自动构建）

改完文章或样式以后：

```bash
npm run publish
```

会清缓存、重新构建、再推上去，1~2 分钟后线上生效。只跑 `npm run deploy` 有时会漏更新（它不一定会重新生成），所以用 `publish` 稳一点。

推送凭据存在这台机器的 Windows 凭据管理器里，换机器要重新登录。

站点地址和部署目标在 `_config.yml` 的 `url` 和 `deploy` 里。以后想用自己的域名，加一个 `source/CNAME` 文件写上域名，再去域名商那边加 CNAME 解析。

## 目录

```
_config.yml              站点配置
source/_posts/           文章
source/_data/argon.yml   主题配置
source/assets/           图片、css
themes/argon/            主题
tools/                   封面导出、截图验收的脚本
```
