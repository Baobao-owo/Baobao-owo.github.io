# AGENTS.md

本仓库是中二节奏曲库站（Hexo + Argon）。

**动手前必读：`docs/chuni-site-notes.md`（站点规则）和 `docs/chuni-data-sources.md`（游戏数据源路径、Mate A300 语义、扫描约定）**——里面记录了曲库数据结构、合作谱判定规则、谱师显示约定、筛选与遮罩逻辑、翻译/梗研究流程、部署流程和已知坑。

## 硬性约定

- 部署：`main` 推送 → GitHub Actions → `gh-pages`；推送前 `git stash push -m tmp` → `git pull --rebase origin main` → `git push origin main` → `git stash pop`
- 禁止本地 `hexo deploy`；另一个会话也在改同一仓库，冲突用 rebase 解决
- 改完数据/模板：`npm run clean && npm run build`，确认无 ERROR 再推
- 线上验证加 `?cb=随机数`，GitHub Pages 有 3–5 分钟 CDN 缓存
- 复杂 JS 一律写成 `.mjs` 执行，不要内联进 PowerShell
- 合作谱 / 谱师 / 定数的判定改动，先看说明文档第 2、3、10 节，避免破坏既有规则
- 重扫曲库前先读 `docs/chuni-data-sources.md`：日服 Mate 本体 + `bin\option\A300` 是删曲来源，`D:\XVX` 只做国服对照；A300 目录顺序不是官方曲序
