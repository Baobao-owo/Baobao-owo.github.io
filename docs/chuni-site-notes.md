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
7. 要重扫曲库数据：先读 `docs/chuni-data-sources.md`（Mate 本体 + A300 删曲、XVX 对照、字段来源、扫描约定与已知坑）。

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

> 坑：只有 `internalValue` 没有 `internal` 时表格显示 `—`，用 `tools/data/fix_internal_consts.mjs` 补。

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

- `tools/data/import_song_wiki.mjs "曲名"`：按 wiki 索引找页面（自动处理 `U＆iVERSE ‐銀河鸞翔‐` 这类全角差异），补 `wiki_info`、`origins`、物量
- `tools/data/build_glossary.mjs` → `_tmp/chuni-glossary.json`：汇总专有名词与既有译法，`glossary-fill*.json` 是人工补充
- `tools/data/apply_translations.mjs` / `apply_rule_translations.mjs`：把确认过的译文写回数据
- `tools/reports/export_zh_pending.mjs` / `export_zh_lines.mjs`：导待译清单；`merge_extra_translations.mjs` 合并
- `tools/data/fix_title_translations.mjs`：修称号条件的机翻硬错误
- `tools/data/trim_title_notes.mjs`：砍掉串进称号列的「※…」备注

**规整约定**：

- 曲名、谱师名、ND 名义保留原文，不音译
- 称号、版本名、分类名按中文惯例译（参考已有 `titles_zh`）
- 术语统一：定数、物量、谱面作者、WORLD'S END、ULTIMA
- 机翻常见错误（已批量修，262 处）：`プレイ` 被译成「播放」→ 应为**游玩**；`MASTER以下全て/プレイ` 被译成「全部位于主控/播放下方」→ **MASTER 及以下全部/游玩**；`FULL CHAIN` 被译成「全链条」→ **全连**
- 称号列的 `※…` 备注属于「条件」列，翻译时容易串到称号格，串了就截断

## 4. 梗 / 由来（neta）

- `tools/fetch_*.mjs` 抓 wiki / bilibili / copel 等原始资料，落 `_tmp/wiki/`
- `tools/data/build_wiki_page_index.mjs` 建曲名 → wiki 页面名索引（`_tmp/wiki/page-index.json`）
- `tools/data/neta_research.mjs`：逐曲整理「由来」，输出 `_tmp/neta/<slug>.json` 与 `_summary.json`，字段含原文、出处、译文
- `tools/data/build_neta_evidence_strict.mjs` / `build_neta_review_docx.py`：生成证据与评审 docx，交人工确认
- 确认后的内容进 `chuni_extra.json` 的 `origins(_zh)` / `wiki_comment_zh`，页面按「ND 名义与称号的由来」区块展示
- WE 谱名的梗另有 `tools/data/apply_we_names.mjs`、`_assign_we_jokes.mjs`

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
| 从 wiki 补单曲资料 | `tools/data/import_song_wiki.mjs "曲名"` |
| 从 wiki 由来里抽分工表 | `tools/data/import_parts_from_origins.mjs "曲名"` |
| 重建谱师索引 | `tools/build_designers_merged.mjs` |
| 重建别名表 | `tools/build_designer_alias.mjs` |
| 单张改署名 | `tools/data/set_sheet_designer.mjs "曲名" m "署名"` |
| 补定数文本 | `tools/data/fix_internal_consts.mjs` |
| 合作数据清洗 | `tools/data/clean_collab.mjs` / `rebuild_collab.mjs` |
| 手填合作写回 | `tools/apply_manual_collab.mjs` |
| 自 VS 归一单人 | `tools/fix_same_person_credits.mjs` |
| 合作疑问清单 | `tools/reports/list_questionable_collab.mjs` → `make_collab_questions_docx.py` |
| 应用确认结论 | `tools/apply_collab_decisions.mjs` + `verify_collab_decisions.mjs` |
| 称号翻译修正 | `tools/data/fix_title_translations.mjs` / `trim_title_notes.mjs` |
| 梗/由来研究 | `tools/data/neta_research.mjs` |

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

## 10. 筛选与遮罩的最终规则（2026-11-15 定稿）

所有限制按「交集」处理：先收敛曲目集合，再排序展示。

- **可见难度** = 谱师写的谱（选了谱师时）∩ 单独/合作模式的谱 ∩ 等级条件（选了等级时）
- 列表徽章只点亮可见难度，其余显示 `—`；绿底合作标签也只显示可见难度里的条目，避免「标签写 A、亮的却是 M」
- **全灰行不显示**：合作 / 单独模式下，一张谱都点不亮的曲目直接从列表剔除
- **等级索引互斥**：点一个等级只筛该等级，再点一次取消；不会与上一次的选择叠加
- **数量提示**：任何筛选生效时，数量后追加「（已筛选，全库 N 首）」；默认状态不显示
- **状态恢复**：从详情页返回时按字段白名单恢复筛选；`designerDiff` 缺失时回落为五档全选
- `仅显示合作` / `仅显示单独` 互斥；谱师面板收起时清空面板内筛选

## 10.6 等级与 chips 的两个坑（2026-11-15）

- **返回后筛选按钮变灰**：`renderLevelChips()` 重建按钮时必须把 `state.levels` 画回 `active`，否则从曲目页返回，列表还筛着、按钮却是灰的。
- **15+ 的判定**：业务上 15+ 是定数 ≥15.5，15 是 15.0~15.4。数据里若出现 `level: "15+"` 但定数 <15.5（如狂命 15.2），是脏数据，要改回 `15`；可以全库扫一遍这类异常。

## 10.7 谱师面板计数与「只有合作署名」的人（2026-11-15）

- 面板里的曲数 `countFor()` 现在把「在 collab.json 里作为该谱难度成员出现」也算进去；否则像 `原D(羽田の白い彗星)` 这种只在合作名单里的人永远显示 0（用户反馈过）。
- 别名要跟着数据走：`designers.json` 每条多一个 `aliasNames`，面板按别名匹配合作名单（`原D` / `羽田の白い彗星` 都是同一个人的写法）。
- 默认隐藏删除曲时，只在删除曲里出现的合作不会被计入；想看全量要打开「仅显示删除曲」。
- Verse X 的 MASTER 谱面作者：原署名是 `Thank you for 10 years of CHUNITHM`，按谱面汇报留言（夕凪アロエ 说去帮了 ぴちネコ）改为 `ぴちネコ × 夕凪アロエ`，并加入 collab.json（`m` 两位成员）。

## 10.8 B/A 谱面作者索引（2026-11-15）

- 现象：Mate 新曲在「仅显示单独」里 B/A 谱是灰的——`kn`（作者已知）标记来自 `designers.json` 的 songs 索引，而索引原先只从 c2s / 朋友数据取，Mate 新曲的黄绿谱只有站内 `chuni_designer_fill.json` 有署名，索引里查不到。
- 修法：`tools/build_designers_merged.mjs` 取 raw 时按顺序兜底 —— c2s → 朋友数据 → `chuni.json` 的 sheet.designer 原文 → `chuni_designer_fill.json`（键是大写 B/A/E/M/U）。
- 效果：狂命、SAN値直葬、雑魚、Fox Hunt 等 B/A 恢复彩色；谱师面板各人曲数同步上涨。
- 仍未收录的：`supported by …`、`A vs B`、`+ ?*10`、`/` 这类组合写法（solo 模式下本就该灰），以及 `ざぁこレモン`、`◆ミニミライト( ; >ω<)`、`逆風オールバック` 等不确定名义，等用户决策后再映射。

## 10.9 玩梗署名与「已知谱师」的判定（2026-11-15）

- 站内有 `chuni_designers_info.json`（62 位谱师的 ND 名义介绍与别名）和 `chuni_designer_alias.json`（953 条别名），能查的先在这里查，不要一上来就问用户。
- 本次从别名/介绍/留言里能确认的 11 条已补进 `tools/designer-alias-extra.json`：ざぁこレモン→じゃこレモン、◯ソ譜面三銃士を連れてきたよ→ロシェ＠ペンギン、しばらくお待ち下さい。→Revo＠LC、全國共通リズム感テスト→譜面-100号、巫女みcosmos→じゃこレモン、イロドリミドリ系列三条→ぴちネコ、わしがつるぺったんな話→ぴちネコ、チュウニ譜面ボーイズ→ロシェ＠ペンギン。
- 判定逻辑改了：`isKnownDesigner` 先看索引里归一后的 `who`，再看 raw/别名。原来只看 raw 与别名表，导致「别名表里没有、但索引已归一」的署名仍被判未知（全站未知谱面 306→248）。
- 剩余 140+ 条单体署名是玩梗/占位写法（`／／／／／／／／`、`©︎2024 CHUNITHM`、`！！！！`、绘文字、`…Who are you?`），不是人，保持「未知」是对的，别再追问。

### 10.9.1 用户裁定（2026-11-15）

- 组合写法（`supported by` / `vs` / `+ ?*10` / 斜杠）**算合作**，不拆主作者，保持未知是对的。
- WE 主题署名（`TraNsforM "NEW"`、`Trajectory of "Linked VERSE"`、`Memoir of "AdministratoR"` 等）是比较大的一个名义，游戏没有解禁具体谱师，**先不归人**；以后谱面留言提到了再加。
- 那 9 条（OLIVIER X、J1219、逆風オールバック、後光荒神、伸ばしてみた、TAPの脅威が君に襲い掛かる！、for C+、SUPERCOLORFUL、ゲキ！チュウマイ公式ちゃんねる）**都是 WE 谱面**；WE 谱面作者大多不公开，除非官方报道/谱面留言提及，否则一律不归人。待认表作废。
- `2175_4 シル・ヴ・プレジデント ULTIMA` 与 10 首缺 musicId：**暂无数据，不主动提醒**；日服之后更新了再补。

## 11. 维护纪律

- 每次动手改曲库站之前，按顺序读：`AGENTS.md` → `docs/chuni-site-notes.md` → `docs/chuni-data-sources.md` 的第 0、7、8、11 节；看完再动代码
- 说「本地没有 / 数据缺失」之前必须有搜索证据：先跑 `node tools/fetch/scan_c2s_recursive.mjs`（谱面）或列出搜过的根目录与匹配规则，不允许只看一层目录就下结论
- 踩过的坑当天写回 `docs/chuni-data-sources.md` 第 11 节「重犯清单」，并在这里补一条纪律；不要只靠对话记忆
- 改完数据或模板，跑 `npm run build` 本地确认，再按 stash → pull --rebase → push 流程推送
- 线上验证用带 `?cb=` 的 URL，等待 3–5 分钟让 Pages 缓存刷新

## 12. 博客后台（/admin）维护

线上后台是 Decap CMS，登录走 **DecapBridge**（配置见 `source/admin/config.yml`，站点 ID `8f0f951c-346f-401d-ad2b-c39dc10f739e`）。

常见故障与处理：

- 页面提示 `site administrator to reissue the Git Gateway token`：DecapBridge 里存的 GitHub 令牌失效。
  1. GitHub → Settings → Developer settings → Personal access tokens 生成新令牌（Fine-grained，选中本仓库，`Contents` 与 `Pull requests` 设为 Read and write，期限选 No expiration）
  2. <https://decapbridge.com> → My Sites → **Manage site** → **Settings** → 清空 `Github access token` → 粘贴新令牌 → Save
  3. 回 `/admin` 强刷后重新登录
- 页面能开但登录后空白/无限跳转：多半同样是令牌问题，或浏览器缓存了旧的 PKCE 状态，先强刷再试
- 站点在 DecapBridge 被删除：新建站点绑定仓库，拿到新 Site ID 后替换 `config.yml` 里 `auth_endpoint` / `auth_token_endpoint` 的 ID

## 13. 本地后台（不依赖 DecapBridge）

需要改文章又不想折腾线上登录时：

1. 双击仓库根目录 `启动本地后台.bat`
2. 它会开两个窗口：`npx decap-server`（8081）与 `npm run dev`（4000），并自动打开 `http://localhost:4000/admin/`
3. 点「登录」直接进入（配置里 `local_backend: true`）
4. 编辑保存写的是本地文件；改完关窗口，让 agent 按正常流程提交推送

注意：本地后台的两个窗口不能关，关了会断开。

- **c2s 素材位置**（2026-11-15）：谱面不在平铺的 `music` 目录（那里只有 MusicSort.xml），而在 `music\musicXXXX\` 子目录里，例如 `HDD\bin\option\A001\music\music0242\0242_00.c2s`；日服根目录多一层 `HDD`。找素材要递归搜。


### 10.10 WORLD'S END 按谱面拆行

- `chuni_we.json` 有 `songs`（按曲名，兼容旧页面）与 `byId`（按 musicId，一谱一条）两套索引。
- 列表数据生成时，同一曲名有多张 WE 谱会拆成多行，每行带 `wid`（musicId）、`we:[星数]`、`weAttr`，星数与属性都取自该谱面自己的 `Music.xml`（`starDifType` → ☆ = ceil(n/2)，`worldsEndTagName` → 属性）。
- 只有开启「WORLD'S END」开关时这些行才出现；默认列表不受影响。
- 同一曲名如果有「WE 专属条目」，WE 行只挂在它上面，避免和普通谱条目重复；拆行时按 `曲名|wid` 去重。
- 2026-11-15 状态：`byId` 292 条，列表挂上 284 条（8 条在站内没有对应条目），全库行数 2152 → 2278。


### 10.11 难度筛选会隐藏整首

- 只勾部分难度（例如只勾 ULTIMA）时，没有该难度的曲目会直接从列表里隐藏，而不是留一行灰色定数。
- 实现位置：`themes/argon/layout/chuni-list.ejs` 的 `filtered()`，判断 `state.designerDiff` 长度 1–4 时，要求 `r.sh` 里存在对应难度。
- 合作 / 单独模式不受这条影响（它们有自己的可见谱判定），默认五档全选时也不受影响。
- 2026-11-16 实测：默认 1689 首，只勾 MASTER 仍 1689（每首都有 M），只勾 ULTIMA 为 113 首。


### 10.12 首页入口与页面外壳

2026-11-16 调整后，站点入口的层级和外壳约定：

- 首页工具站横幅（`themes/argon/layout/home.ejs` 的 `.tool-banner`）只放一行标题「中二节奏工具站」+ 副标题「中二节奏wiki整理」，前面带一个白点；点击进入落地页。
- 导航链路：首页横幅 → `/categories/中二节奏/`（`chuni-landing.ejs`）→ 落地页「进入曲目导览」→ `/chuni/` 列表。落地页左上角有「← 返回首页」，列表页有「← 返回 中二节奏」。
- 页脚已整条移除（`themes/argon/layout/footer.ejs` 不再输出 `<footer>`），内容区由 `#primary { padding-bottom: 36px }` 留底部空隙。
- 文章列表卡片整块可点：`source/assets/js/card-click.js`（在 `source/_data/argon.yml` 的 `custom_html_foot` 里引入），点卡片任意位置进文章，点标签/按钮/选中文字时不拦截。
- 首页「全部分类 →」入口已删除；分类入口走各板块卡片。


### 10.13 改分类板块名，要连文章一起改

后台（DecapBridge / CMS）能改的是 `source/_data/categories.yml`，它只决定首页板块卡片显示什么名字、顺序、描述和子分类样式；文章自己的分类写在每篇 front matter 的 `categories` 里。

只改前者会出现：

- 首页多出一张「0 篇 / 还没有内容」的空板块（新名字，配不上任何文章）
- 同时原来的真分类又冒出一张卡片（旧名字，文章还挂在那儿）

2026-11-16 就这么踩了一次：把「谱面记录」改成「个人谱面存档记录」、把「杂谈」改成「杂谈，文章」后，首页同时出现四张卡。修法是把 80 篇文章的 `- 谱面记录` 改成 `- 个人谱面存档记录`、那篇杂谈的 `categories: 杂谈` 改成 `categories: 杂谈，文章`，重新构建后板块和计数才对齐。

改名的副作用：分类页 URL 跟着变（`/categories/个人谱面存档记录/`），旧链接会 404；`aliases` 字段目前没有代码在用，不要指望它做跳转。


### 10.14 封面图下半段的淡出

问题：封面图和下面内容板块重叠是主题原本的设计，但图片下沿直接怼在深色背景上，两侧露出来的图会像一条突兀的色带。

做法：在 `source/assets/css/baobao.css` 给 `#banner::after` 加一层从透明到页面底色的渐变。

- 亮色：白底 `#f4f5f7`，力度小一些（35% 处 0.16、74% 处 0.46）
- 暗色：`#303030`，力度大一些（30% 处 0.32、70% 处 0.78）
- AMOLED 暗色：`#151515` 单独一套

渐变高度取 banner 的 50%，正好从标题下方开始，不会糊到标题。

试过把 `#content` 的 `margin-top` 从 `-30vh` 改成 `-25px`（让内容从封面底边开始、完全不重叠），版式会变，用户觉得不如原来好看，已回退，保留「内容压在封面上 + 底部淡出」的方案。

### 10.15 WORLD'S END 的删除标记按服务器分开
两服存活的 WE 谱并不一致，所以 WE 行不能只看曲目本身是否下架。

- 数据：`source/_data/chuni_we.json` 的 `byId` 每条 WE 谱记录都带 `delJP` / `delCN`（1 = 该服已删）。
- 日服存活来源：Mate 的 `Music.xml`，排除 `mate_a300`（削除曲包），取 WorldsEnd 谱 `enable=true` 的 musicId。
- 国服存活来源：落雪（lxns）歌曲列表里 `difficulty=5` 的 musicId，用的是 2026-11-12 的本地快照 `_tmp/lxns-songs.json`。
- UI：`themes/argon/layout/chuni-list.ejs` 的 `weDeleted(r)` 按 `state.version` 取对应字段，`rowDeleted(r)` 统一给筛选用；WE-only 伪条目没有按谱拆出来的 id 时，退回曲目级的 `rm` / `cnrm`。
- 行为：勾上 WORLD'S END 后，「不显示删除曲」默认只列该服仍存活的 WE 谱；「仅显示删除曲」只列该服已删的 WE 谱，行内带「删除曲」标签。
