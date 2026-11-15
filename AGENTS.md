# AGENTS.md

本仓库是中二节奏曲库站（Hexo + Argon）。

**动手前必读：`docs/chuni-site-notes.md`（站点规则）和 `docs/chuni-data-sources.md`（游戏数据源路径、Mate A300 语义、扫描约定）**——里面记录了曲库数据结构、合作谱判定规则、谱师显示约定、筛选与遮罩逻辑、翻译/梗研究流程、部署流程和已知坑。

每次开新任务，按这个顺序先读一遍再动手：

1. `AGENTS.md`（本文件）
2. `docs/chuni-site-notes.md` 第 10 节（筛选规则）、第 11 节（维护纪律）
3. `docs/chuni-data-sources.md` 第 0 节（一句话）、第 7 节（数据清单）、第 8 节（未裁定对撞）、第 11 节（重犯清单）

## 硬性约定

- **不要假设文件不存在**：说「本地没有」之前先递归搜（谱面跑 `node tools/fetch/scan_c2s_recursive.mjs`），搜索根目录和匹配规则一并写进回复
- **踩过的坑当天归档**：写进 `docs/chuni-data-sources.md` 第 11 节，并在 `docs/chuni-site-notes.md` 第 11 节补纪律；不靠对话记忆
- 部署：`main` 推送 → GitHub Actions → `gh-pages`；推送前 `git stash push -m tmp` → `git pull --rebase origin main` → `git push origin main` → `git stash pop`
- 禁止本地 `hexo deploy`；另一个会话也在改同一仓库，冲突用 rebase 解决
- 改完数据/模板：`npm run clean && npm run build`，确认无 ERROR 再推
- 线上验证加 `?cb=随机数`，GitHub Pages 有 3–5 分钟 CDN 缓存
- 复杂 JS 一律写成 `.mjs` 执行，不要内联进 PowerShell
- 合作谱 / 谱师 / 定数的判定改动，先看说明文档第 2、3、10 节，避免破坏既有规则
- 重扫曲库前先读 `docs/chuni-data-sources.md`：日服 Mate 本体 + `bin\option\A300` 是删曲来源，`D:\XVX` 只做国服对照；A300 目录顺序不是官方曲序
- 找数据源先看 `docs/chuni-data-sources.md` 第 7 节（本地 JSON / 网站 / GitHub 项目清单），第 8 节是尚未裁定的「内部对撞」清单——不要按对撞点里未确认的那一侧批量改数据

## 数据冲突处理（底层逻辑）

数据两边对不上时，不要自己挑一边下手：

1. 先按同一口径把差异算出来，落成 TSV / Excel。
2. 做成一张「待裁定表」交给用户，逐条给选项（取站内 / 取外部 / 两边保留 / 先不动）。
3. 用户裁定前，只做不影响判断的机械部分（去重、剥脚注、标点归一）。
4. 裁定后按结果写回，并在 `docs/chuni-data-sources.md` 记一笔。

