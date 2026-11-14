# 中二节奏曲库站维护说明（截至 2026-11-14）

本文件记录曲库站（`chuni` 频道）的数据结构、判定规则、生成流程与历史踩坑，供后续接手或上下文丢失时快速恢复。

## 1. 站点与部署

- 仓库：`D:\Deepseek work\blog`（Hexo 8 + Argon 主题，Node 24）
- 线上：<https://baobao-owo.github.io/chuni/>
- 部署链路：`main` 分支推送 → GitHub Actions（`.github/workflows/deploy.yml`）构建 → 发布到 `gh-pages`
- 推送前固定动作：`git stash push -m tmp` → `git pull --rebase origin main` → `git push origin main` → `git stash pop`
- 禁止本地 `hexo deploy`；另一个会话同时在同一仓库改东西，冲突以 rebase 解决
- 本地预览：`npx hexo server -p 4321`（改了模板/脚本要先 `npm run clean` 再 `npm run build`）

## 2. 数据文件

### 2.1 曲库

| 文件 | 说明 |
|---|---|
| `source/_data/chuni.json` | 曲库主数据：曲名、艺术家、BPM、版本、分类、`sheets[]`、封面、视频等 |
| `source/_data/chuni_removed_songs.json` | 已删除曲（140 首），`id` 形如 `REMOVED:<曲名>` |
| `source/_data/chuni_ids.json` | 曲名 → musicId |
| `source/_data/chuni_cn.json` / `chuni_cn_removed.json` | 国服数据 |
| `source/_data/chuni_we.json` / `chuni_we_deleted.json` | WORLD'S END 谱面（星级、属性） |
| `source/_data/chuni_youtube.json` | 曲目外链视频 |

`sheets[]` 每项关键字段：

- `difficulty`：`basic / advanced / expert / master / ultima`，WE 谱为 `【狂】` 这类带方括号的字符串
- `level`：显示的等级，如 `13+`
- `internal`：显示的定数文本，如 `13.5`（**表格里那一列**）
- `internalValue`：定数数值，用于排序与比较
- `designer`：**游戏内原文署名**，不做别名合并
- `notes`：物量统计
- `regions`：日服/国际服可用性

> 坑：部分谱面只有 `internalValue` 没有 `internal`，表格会显示成 `—`。用 `tools/fix_internal_consts.mjs` 按数值补齐（会跳过 WE 谱，它们没有定数）。

### 2.2 谱师

| 文件 | 说明 |
|---|---|
| `source/assets/data/designers.json` | 谱师索引：`designers[]`（名字/谱面数/曲目数/别名数）、`songs{}`（曲名 → 难度 → `{who, raw}`）、`loose[]`（团队/恶搞名义） |
| `source/_data/chuni_designer_alias.json` | 署名原文 → 谱师（949 条）；值里带 `×` 的是组合别名 |
| `source/_data/chuni_designer_fix.json` | 按「曲名::难度」覆盖显示署名，如把某张 WE 谱的名义从普通谱挪走 |
| `source/_data/chuni_designer_fill.json` | 自动补全的填充数据 |
| `source/_data/chuni_designers.json` / `chuni_designers_info.json` | 旧版权限/介绍数据，仍被部分脚本引用 |

规则：

- 详情页「谱面作者」**显示游戏内原文**，不做别名归一
- 只有当别名是「看不出成员」的组合名（`レモンとアロエ`、`Technologie`）时，才在下面用灰色小字补 `（成员 × 成员）`
- 原文本身已经写了 `A vs B` / `A & B` / `A × B` 的，不再重复括号
- 作者不明的谱面（`who` 为空、署名归不到任何谱师）既不算「合作」也不算「单人」

手工改单张谱署名：`node tools/set_sheet_designer.mjs "曲名" m "署名"`（同时同步 `designers.json`）。

### 2.3 合作谱

| 文件 | 说明 |
|---|---|
| `source/assets/data/collab.json` | 合作谱：曲名 → 难度 → 参与者列表（全小写规范化键） |
| `source/assets/data/collab-parts.json` | wiki「担当箇所 / 担当ND」分工表（17 首） |
| `source/_data/collab_docx_titles.json` | 谱师学 ep0.5 docx 里列过的 166 首白名单 |
| `source/_data/collab_parts.json` | `collab-parts.json` 的 Hexo 数据副本（构建时读取，必须同步） |
| `tools/collab-exclude.json` | 明确「不是合作」的排除名单 |
| `tools/designer-alias-extra.json` | 手工补的别名/团队成员关系（值带 `×` 即视为组合） |

**合作判定（任一命中）**：

1. 曲名在 docx 白名单里（排除 `tools/collab-exclude.json`）
2. 同一难度的参与者 ≥ 2（`collab.json`）
3. 某难度署名为双人写法：`&`、`＆`、`vs`、`×`、`＋`、`+`、`supported by`、`resurrected by`、`fumbled by`、`panicked by`、`cooperated`、`affected by`、`fused with`、`meets`、`feat.`、`＜ー＞`、`<―>`、`<->`、`-+-`
4. 署名属于团队名义（`designers.json` 的 `loose`，或别名表里带 `×` 的组合名）

**展示**：

- 列表里所有确认过的合作谱常显绿底标签，如 `M 合作 A × B`：优先用 `collab.json` 的参与者，其次用组合别名，最后从署名按分隔符拆
- 筛选模式：`仅显示合作` / `仅显示单独` 互斥；合作模式只点亮合作难度，单独模式点亮单人难度，其余灰掉
- 定数遮罩查不出合作难度时全灰，不要整行全亮

## 3. 列表页（`chuni/index.html`）交互

- 顶部工具栏：日服/国服切换、分类、按谱师筛选、排序（版本 / 标题首字母 / 定数）、倒序
- 难度 chip：`全部难度 / BASIC / ADVANCED / EXPERT / MASTER / ULTIMA`，**默认五档全选**；取消勾选后对应难度的定数在列表里变灰
- 定数档 chip：按等级过滤，手机端横向滑动单行
- 谱师面板：收起时清空面板内所有筛选（谱师、合作模式、搜索词）
- 每页 50 首，筛选状态存 `sessionStorage`（键 `chuni-list-state-v1`），从曲目页返回会恢复
- 搜索：曲名框 + 艺术家框，匹配前做 NFKC 归一、去空格、大小写不敏感

## 4. 翻译与规整

- `tools/import_song_wiki.mjs`：抓 wiki 曲目页，写入 `chuni_extra.json` 的 `wiki_jp` / `wiki_info` / `wiki_levels` 等
- `tools/build_glossary.mjs`：汇总专有名词与已有译文，输出 `_tmp/chuni-glossary.json`；`glossary-fill*.json` 是人工补充
- `tools/apply_translations.mjs` / `apply_rule_translations.mjs`：把确认过的译文写回 `chuni_extra.json` 等数据文件
- `tools/export_zh_pending.mjs` / `export_zh_lines.mjs`：导待译清单；`merge_extra_translations.mjs` 合并
- 译文规整约定：
  - 曲名、谱师名、ND 名义保留原文，不音译
  - 称号、版本名、分类名用中文惯例译法（参考 `chuni_extra.json` 里 `titles_zh`）
  - 术语统一：`定数`、`物量`、`谱面作者`、`WORLD'S END`、`ULTIMA`
  - 英文缩写与全角/半角保持原文习惯，不强行转换

## 5. 梗 / 由来内容

- `tools/fetch_*.mjs`（wiki / bilibili / copel 等）抓取原始资料
- `tools/neta_research.mjs`：逐曲整理「由来」记录，输出到 `_tmp/neta/<slug>.json` 与 `_summary.json`，字段含原文、出处、译文
- `tools/build_neta_evidence_strict.mjs` / `build_neta_review_docx.py`：生成严格版证据与评审 docx，交给人工确认
- 确认后的内容进 `chuni_extra.json`（`wiki_extra_ja` 原文 + `wiki_comment_zh` 中文），页面按「梗/由来」区块展示
- `tools/apply_we_names.mjs`、`_assign_we_jokes.mjs`：WE 谱名的梗处理

## 6. 谱面预览

- 生成端：Marisa 前端（`_tmp/marisa/repo/Marisa.Frontend`）+ puppeteer 渲染，产物上传到 GitHub Release `chuni-previews-extra`
- manifest：`source/_data/chuni_previews.json`（A/B 分片），键为 `<musicId>_<diffIdx>`
- 更新脚本：`tools/render_new_previews.mjs`、`build_preview_manifest.mjs`、`reconcile_previews.mjs`
- 单曲页进入后会空闲预加载最多 6 张预览

## 7. 已知坑

1. **GitHub Pages 有 CDN 缓存**：推送成功到线上生效可能差 3–5 分钟，验证时加 `?cb=随机数`，或等 Actions 完成
2. **另一个会话同时改仓库**：每次动手前先 `git pull --rebase`，提交前再 stash/pull/push
3. **PowerShell 内联复杂 JS** 会把 Unicode 和引号弄坏，一律写成 `.mjs` 再执行
4. **EJS 模板里别塞调试标记**，`<% %>` 内的 HTML 注释会导致渲染异常
5. **数据双份**：`source/_data/collab_parts.json` 与 `source/assets/data/collab-parts.json` 必须一致，否则分工表不显示
6. **别名表重建**：改 `designer-alias-extra.json` 后要跑 `build_designers_merged.mjs` + `build_designer_alias.mjs`
7. **`internal` 与 `internalValue` 分离**：只补其中一个，表格会显示 `—` 或排序错乱
8. **WE 谱没有定数**：只有星级（`we[]`），不要补 `0.0`
9. **作者不明 ≠ 合作**：`who` 为空的署名在两种筛选模式下都应灰掉

## 8. 常用脚本速查

| 用途 | 脚本 |
|---|---|
| 重建谱师索引 | `tools/build_designers_merged.mjs` |
| 重建别名表 | `tools/build_designer_alias.mjs` |
| 补 c2s 署名 | `tools/extract_c2s_creators.mjs` → `tools/fill_designers_from_c2s.mjs` |
| 补定数文本 | `tools/fix_internal_consts.mjs` |
| 单张改署名 | `tools/set_sheet_designer.mjs` |
| 合作数据清洗 | `tools/clean_collab.mjs` |
| docx 合作解析 | `tools/build_collab_from_docx.mjs` → `merge_collab_docx.mjs` |
| 谱师分类清单 | `tools/make_designer_report.py` |
| 无归属清单 | `tools/make_unassigned_report.py` |
| 梗/由来研究 | `tools/neta_research.mjs` |
