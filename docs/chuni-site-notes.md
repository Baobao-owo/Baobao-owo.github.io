# 中二节奏曲库站维护说明

> 截至 2026-11-14。记录曲库站的数据结构、判定规则、翻译与梗的处理流程、检索逻辑、部署方式与历史踩坑。
> 用途：换会话 / 换人接手 / 上下文丢失时，照这份就能把站点跑起来并接着改。

## 0. 快速恢复（先看这个）

1. 工作目录 `D:\Deepseek work\blog`，Hexo 8 + Argon 主题，Node 24。
2. 线上 <https://baobao-owo.github.io/chuni/>，推送 `main` → GitHub Actions → `gh-pages`。
3. 改模板/脚本后必须 `npm run clean && npm run build`，否则会出现「0 files generated」的假成功。
4. 提交前固定动作：`git stash push -m tmp` → `git pull --rebase origin main` → `git push origin main` → `git stash pop`。
5. 禁止本地 `hexo deploy`；另一个会话也会同时改这个仓库。
6. 验证线上要加 `?cb=随机数`，Pages 有 3–5 分钟 CDN 缓存。

## 1. 数据文件

### 1.1 曲库

| 文件 | 说明 |
|---|---|
| `source/_data/chuni.json` | 曲库主数据：曲名、艺术家、BPM、版本、分类、`sheets[]`、封面、视频 |
| `source/_data/chuni_removed_songs.json` | 已删除曲（142 首），`id` 形如 `REMOVED:<曲名>` |
| `source/_data/chuni_ids.json` | 曲名 → musicId |
| `source/_data/chuni_cn.json` / `chuni_cn_removed.json` | 国服曲库 / 国服下架 |
| `source/_data/chuni_we.json` / `chuni_we_deleted.json` | WORLD'S END 谱面（属性、星级） |
| `source/_data/chuni_youtube.json` | 曲目外链视频 |

`sheets[]` 关键字段：

- `difficulty`：`basic / advanced / expert / master / ultima`；WE 谱是 `【狂】` 这类带方括号的字符串
- `level`：显示等级，如 `13+`
- `internal`：显示定数文本，如 `13.5`（表格里那一列）
- `internalValue`：定数数值，用于排序比较
- `designer`：**游戏内原文署名**，不做别名合并
- `notes`：物量（tap / hold / slide / air / flick / total）
- `regions`：日服/国际服可用性

> 坑：只有 `internalValue` 没有 `internal` 时表格显示 `—`，用 `tools/fix_internal_consts.mjs` 补。

### 1.2 谱师

| 文件 | 说明 |
|---|---|
| `source/assets/data/designers.json` | 谱师索引：`designers[]`、`songs{}`（曲名→难度→`{who, raw}`）、`loose[]`（团队/恶搞名义） |
| `source/_data/chuni_designer_alias.json` | 署名原文 → 谱师（约 950 条）；值里带 `×` 的是组合 |
| `source/_data/chuni_designer_fix.json` | 按「曲名::难度」覆盖显示署名 |
| `source/_data/chuni_designer_fill.json` | 自动补的填充数据 |
| `source/_data/chuni_designers.json` | 旧版按曲名映射的表，部分脚本仍在用 |

规则：

- 详情页「谱面作者」显示**游戏内原文**，不归一别名
- 只有组合名「看不出成员」时，才在下面用灰字补 `（成员 × 成员）`；原文已写 `A vs B` 的不重复
- `who` 为空（署名归不到任何谱师）= 作者不明，既不算合作也不算单人
- 改名/合并只认明确来源（wiki 别名表、用户确认），不做模糊猜测

### 1.3 合作谱

| 文件 | 说明 |
|---|---|
| `source/assets/data/collab.json` | 合作谱：曲名 → 难度 → 参与者列表 |
| `source/assets/data/collab-parts.json` | wiki「担当箇所 / 担当ND」分工表 |
| `source/_data/collab_parts.json` | 上面那份的 Hexo 副本（构建时读，必须同步） |
| `source/_data/collab_docx_titles.json` | 谱师学 ep0.5 docx 白名单（166 首） |
| `tools/collab-exclude.json` | 用户确认「不是合作」的排除名单 |
| `tools/designer-manual.json` | 手填别名 / 合作参与者 / 新谱师 |
| `tools/designer-alias-extra.json` | 手工补的别名与团队成员关系 |

**合作判定（任一命中即合作）**：

1. 同一难度参与者 ≥ 2（`collab.json`）
2. 某难度署名带双人写法：`&`、`＆`、`vs`、`×`、`＋`、`+`、`supported by`、`resurrected by`、`fumbled by`、`meets`、`cooperated`、`affected by`、`fused with`、`feat.`
3. 署名属于团队名义（`loose`，或别名表里带 `×` 的组合名）
4. docx 白名单命中（但先过排除名单）

判定前会先剥掉修饰再匹配：`【…】`、`[…]`、`（…）` 里的内容，以及英文单词内部的 `&`（`U&iVERSE` 不算合作）。例：`[O.N.×STAGE!]ミニミライト`、`Redarrow -U&iVERSE-` 都按单人。

**2026-11-14 用户逐条确认后的补充规则**：

- 署名整串在别名表里能归到**某一位谱师**的，一律算单人（`wonder* vs Techno Kitchen`、`黒き翼Moon Strix vs 白き翼六次元モーター` 这类自己 VS 自己）
- docx 白名单只当线索：每个难度都能落到具体谱师的，算单人；只剩团队/不明署名的才算合作
- 确认合作但成员不全时仍标合作，参与者只写已知的（如 `ゴー・トゥ・大都会` 只知 ミニミライト）
- 已确认单人的进 `tools/collab-exclude.json`；确认合作成员写进 `tools/designer-manual.json` 的 `collab` 段，跑 `node tools/apply_manual_collab.mjs`

**展示**：列表里合作谱常显绿底标签 `M 合作 A × B`；「仅显示合作 / 仅显示单独」互斥；合作模式只点亮合作难度，单独模式把合作与作者不明的难度灰掉。

## 2. 列表页检索与筛选逻辑

页面 `chuni/index.html` 是纯前端渲染，数据来自 `chuni-songs.json`（约 2150 行）+ `designers.json` + `collab.json` + `collab-parts.json`。

**过滤顺序**（`filtered()` 内）：

1. 版本：日服 = 全部；国服 = `cn=1` 或 `cnrm=1`（国服下架的也算国服曲库，否则「不显示删除曲」在国服只差 1 条）
2. 删除曲：`hideRemoved` 隐藏 `rm||cnrm`；`removed` 只看删除曲；WE 谱默认隐藏（`!we && isWE` 排除）
3. 难度 chip：默认五档全选，取消勾选的难度**不隐藏曲目**，只把对应定数灰掉
4. 定数档 chip / WE 星级 chip
5. 谱师：`matcher(r)` 只看 **EXPERT / MASTER / ULTIMA** 三档（BASIC / ADVANCED 不参与匹配）
6. 搜索：曲名框 + 艺术家框，匹配前做 NFKC 归一、去空格、大小写不敏感

**其它**：

- 排序：按版本稼动（wiki 配信日 + 当日顺序）/ 按标题首字母 / 按定数；「倒序」独立控制方向
- 分页：每页 50 首；「显示 1–50 / 总数」
- 状态持久化：`sessionStorage['chuni-list-state-v1']`，2 小时内从曲目页返回会恢复筛选与滚动位置
- 谱师面板收起时清空面板内筛选（谱师、合作模式、搜索词）
- 手机端（≤640px）：版本按钮只显示「日服 / 国服」，排序行、难度行、等级行都是**单行横向滑动**

## 3. 翻译与文本规整

**数据落点**：`source/_data/chuni_extra.json`，按曲名索引。

| 字段 | 内容 |
|---|---|
| `wiki_info` | 分类 / 标题 / 艺术家 / BPM / 解禁方法 |
| `origins` / `origins_zh` | ND 名义与称号由来（日文 / 中文） |
| `titles` / `titles_zh` | 可获得称号表（日文 / 中文），逐行逐格对应 |
| `wiki_comment_zh` | wiki 曲目介绍的译文 |
| `wiki_title` | 对应的 wiki 页面名（全角/半角差异时很有用） |

**流程脚本**：

- `tools/import_song_wiki.mjs "曲名"`：按 wiki 索引找页面（自动处理 `U＆iVERSE ‐銀河鸞翔‐` 这类全角差异），补 `wiki_info`、`origins`、物量
- `tools/build_glossary.mjs` → `_tmp/chuni-glossary.json`：汇总专有名词与既有译法，`glossary-fill*.json` 是人工补充
- `tools/apply_translations.mjs` / `apply_rule_translations.mjs`：把确认过的译文写回数据
- `tools/export_zh_pending.mjs` / `export_zh_lines.mjs`：导待译清单；`merge_extra_translations.mjs` 合并
- `tools/fix_title_translations.mjs`：修称号条件的机翻硬错误
- `tools/trim_title_notes.mjs`：砍掉串进称号列的「※…」备注

**规整约定**：

- 曲名、谱师名、ND 名义保留原文，不音译
- 称号、版本名、分类名按中文惯例译（参考已有 `titles_zh`）
- 术语统一：定数、物量、谱面作者、WORLD'S END、ULTIMA
- 机翻常见错误（已批量修，262 处）：`プレイ` 被译成「播放」→ 应为**游玩**；`MASTER以下全て/プレイ` 被译成「全部位于主控/播放下方」→ **MASTER 及以下全部/游玩**；`FULL CHAIN` 被译成「全链条」→ **全连**
- 称号列的 `※…` 备注属于「条件」列，翻译时容易串到称号格，串了就截断

## 4. 梗 / 由来（neta）

- `tools/fetch_*.mjs` 抓 wiki / bilibili / copel 等原始资料，落 `_tmp/wiki/`
- `tools/build_wiki_page_index.mjs` 建曲名 → wiki 页面名索引（`_tmp/wiki/page-index.json`）
- `tools/neta_research.mjs`：逐曲整理「由来」，输出 `_tmp/neta/<slug>.json` 与 `_summary.json`，字段含原文、出处、译文
- `tools/build_neta_evidence_strict.mjs` / `build_neta_review_docx.py`：生成证据与评审 docx，交人工确认
- 确认后的内容进 `chuni_extra.json` 的 `origins(_zh)` / `wiki_comment_zh`，页面按「ND 名义与称号的由来」区块展示
- WE 谱名的梗另有 `tools/apply_we_names.mjs`、`_assign_we_jokes.mjs`

## 5. 谱面预览

- 生成端：Marisa 前端 + puppeteer 渲染，产物上传 GitHub Release `chuni-previews-extra`
- manifest：`source/_data/chuni_previews.json`，键 `<musicId>_<diffIdx>`
- 更新脚本：`render_new_previews.mjs` / `build_preview_manifest.mjs` / `reconcile_previews.mjs`
- 单曲页空闲预加载最多 6 张

## 6. 单曲页结构

`themes/argon/scripts/chuni-guide.js` 生成 `chuni/<slug>/index.html`（`layout: chuni-song`），模板 `themes/argon/layout/chuni-song.ejs`：

介绍 → 谱师留言 → 详细表（难度/等级/定数/物量/谱面作者）→ 合作分工 → 定数变更履历 → 可获得称号 → ND 名义与称号的由来 → 谱面确认 → 谱面预览。

- 每块都有「中文翻译」折叠（`<details>`），无译文时不显示
- 谱面确认行的等级数字要紧跟难度名（不要 `margin-left:auto` 推右）
- 表格列宽：详细表 30% / 12%×3 / auto；称号表 52% / 48%；定数履历 14%×难度数

## 7. 已知坑

1. **GitHub Pages CDN 缓存** 3–5 分钟，验证加 `?cb=随机数`
2. **另一个会话同时改仓库**，动手前先 pull，提交前 stash/pull/push
3. **PowerShell 内联复杂 JS / Python** 会被引号和 Unicode 弄坏，一律写成 `.mjs` / `.py` 文件再跑
4. **EJS 模板里别塞调试标记**，`<% %>` 里的 HTML 注释会渲染异常
5. **数据双份**：`source/_data/collab_parts.json` 与 `source/assets/data/collab-parts.json` 必须一致
6. **别名表重建**：改 `designer-alias-extra.json` 后跑 `build_designers_merged.mjs` + `build_designer_alias.mjs`
7. **`internal` 与 `internalValue` 分离**，只补一个会显示 `—` 或排序错乱
8. **WE 谱没有定数**，只有星级，不要补 `0.0`
9. **作者不明 ≠ 合作**，两种筛选模式下都应灰掉
10. **hexo server 偶发崩溃**：`ERR_CONNECTION_REFUSED` 时重开，`--no-daemon` 更稳；文件被锁（`ReplaceFileW EIO`）说明 server 还占着，先杀 node 进程
11. **wiki 页面名可能不同**：全角 `＆`、`‐`、空格差异，先查 `page-index.json`

## 8. 常用脚本速查

| 用途 | 脚本 |
|---|---|
| 从 wiki 补单曲资料 | `tools/import_song_wiki.mjs "曲名"` |
| 从 wiki 由来里抽分工表 | `tools/import_parts_from_origins.mjs "曲名"` |
| 重建谱师索引 | `tools/build_designers_merged.mjs` |
| 重建别名表 | `tools/build_designer_alias.mjs` |
| 单张改署名 | `tools/set_sheet_designer.mjs "曲名" m "署名"` |
| 补定数文本 | `tools/fix_internal_consts.mjs` |
| 合作数据清洗 | `tools/clean_collab.mjs` / `rebuild_collab.mjs` |
| 手填合作写回 | `tools/apply_manual_collab.mjs` |
| 自 VS 归一单人 | `tools/fix_same_person_credits.mjs` |
| 合作疑问清单 | `tools/list_questionable_collab.mjs` → `make_collab_questions_docx.py` |
| 应用确认结论 | `tools/apply_collab_decisions.mjs` + `verify_collab_decisions.mjs` |
| 称号翻译修正 | `tools/fix_title_translations.mjs` / `trim_title_notes.mjs` |
| 梗/由来研究 | `tools/neta_research.mjs` |

## 9. 2026-11-14 本次改动与决策（对话压缩）

| 事项 | 结论 |
|---|---|
| 称号条件翻译 | `プレイ`→游玩、`FULL CHAIN`→全连、「全部位于主控/播放下方」→「MASTER 及以下全部/游玩」，共修 262 格 |
| 称号列串行 | 4 首的「※…」备注从称号格截掉 |
| 国服删除曲 | 国服下架曲（69 首）算进国服曲库，「不显示删除曲」不再只差 1 条 |
| 手机端 | ≤640px 版本按钮只留「日服/国服」，排序/难度/等级三行横滑，列表行标题换行，单曲表数字列收窄 |
| 谱面确认 | 等级数字紧跟难度名（去掉 `margin-left:auto`） |
| 博客 | 删掉两篇未发的杂谈；导入 B 站专栏「推球杯 Act.2 杂记（上）」（45 图本地化，封面作缩略图，标签只留「比赛」） |
| 落地页 | 标题改「中二节奏 Wiki」，重写介绍，去掉评论区和统计数字 |
| 合作判定 | 自 VS 归一单人；`U&iVERSE` 里的 `&`、`[O.N.×STAGE!]` 前缀不再误判；`夜のサーカス`、`オン×ステージ！`、`Crush the Dystopia` 移出合作 |
| 合作确认清单 | 6 首改单人（チュルリラ / トランスダンスアナーキー / Everlasting Today / Black Swan Lake / Lemegeton / Last Celebration）；11 首补齐合作参与者 |
| 谱师署名 | `eden` 紫谱归 Moon Strix、`X7124` 紫谱归 じゃこレモン；`ロシアンブラック = ぴちネコ` 确认 |
| 分工表 | `玩具狂奏曲 -終焉-` 补上 wiki 由来里的 8 行分工表（含合并单元格的「再編成(MAS)」） |

### 用户偏好（做站时遵守）

- 中文回复，语气活泼但不油腻，不用单字「哈」收尾
- 解释要细、分步骤、命令少（用户自评计算机能力弱）
- 需要人工确认的清单给 **Word（docx）**，留空白列填结论；md 只作工作格式
- 遇到方案有问题先停下问，不硬做
- 数据缺失要直说，不猜

## 10. 文档与备份

- 本文件是唯一权威版：`docs/chuni-site-notes.md`（仓库内，GitHub 可看）
- 每次大改动后：更新本文件 → `python tools/make_site_notes_docx.py` → 提交推送
- Word 版：`_tmp/中二节奏曲库站维护说明.docx`（不入库，按需生成）

## 9. 更新记录

- 2026-11-14：曲库站大整理——合作判定扩展（`supported by` 等 17 种写法）、作者不明不再误判合作、列表绿标常显、谱师成员括号规则、定数履历当前行按真实定数覆盖、定数文本补全 196 张、c2s 署名补全 396 张、难度 chip 默认五档全选并在取消时灰显。
- 2026-11-15：从 wiki 补搬时间段分工表（17 → 28 首），参与者写入 `collab.json`；修复正/倒序按钮未绑定、旧筛选状态恢复导致遮罩失效；新增 `collab-exclude.json` 排除名单与两份谱师清单 exporter。
- wiki 上确实没有分工表的 10 个曲名：`Grip & Break down !!`、`ここで一席！　Oshama Scramble!`、`Mass Destruction ("P3" + "P3F" ver.)`、`Athlete Killer "Meteor"`、`紅`（wiki 条目为 紅華刑）、`Re:Credits`、`Flap&Clap`（两首同名）、`RE:UNION -Duo Blade Against-`、`[IMPERIALDISORDER]`、`Little Busters!～TV animation ver.～`。
