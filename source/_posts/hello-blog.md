---
title: 开站啦：从零把博客搭起来
date: 2026-11-11 17:40:00
categories: 杂谈
tags: [Hexo, Argon, 建站]
---

博客这事想了挺久的。

之前笔记散得太开了：手机备忘录里一段、B 站动态里一条、跟人解释的时候又要重新打一遍……找的时候全是碎的。所以还是得有个自己的地方，按分类放好，想写什么写什么，不用管平台给不给流量。

<!--more-->

## 用了什么

- **Hexo**：静态博客框架。文章是 Markdown，生成出来是纯 HTML，快，也不用数据库
- **Argon 主题**：卡片式版面，能换主题色，带侧栏和文章目录
- **进站封面**：用了一张很喜欢的插画，整站的冷蓝灰色调就是跟着它定的
- **站内搜索**：本地全文搜索，不发请求也能用

整套跑在本地，写完推一下 GitHub Pages 就上线了。

## 写一篇文章

```bash
# 新建一篇
npx hexo new "文章标题"

# 本地预览，默认 http://127.0.0.1:4000
npx hexo server

# 生成静态文件到 public/
npx hexo generate
```

文章在 `source/_posts/` 下面。开头 `---` 包着的那段叫 front-matter，管标题、日期、分类和标签；正文用 Markdown 写，`<!--more-->` 前面那截会自动变成首页摘要。

## 配色是改哪儿

主题色在 `source/_data/argon.yml` 的 `theme_color`，现在是冷钢蓝 `#4f7f9c`，取自封面里那种灰蓝。

右下角那个设置按钮里也能换色、调圆角和阴影，但那是只对当前浏览器生效的临时设置，改文件才是全局的。

封面地址也在 `argon.yml`（`banner_background_url`）；显示时怎么裁切、底边怎么过渡到页面底色，在 `source/assets/css/baobao.css` 里。

## 接下来想做的

- [ ] 把以前的谱面笔记搬过来
- [x] 加个评论区（giscus，评论存在仓库的 GitHub Discussions 里）
- [x] 上线，让别人也能打开（https://baobao-owo.github.io/ ）
