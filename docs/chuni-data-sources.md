# 中二节奏曲库站 · 游戏数据源清单

> 记录时间：2026-11-15。用于扫描曲库、补谱师、补定数、更新删除曲时确定「读哪个盘、读哪个包」。
> 换会话 / 上下文丢失时，先读这份，再动手。

## 0. 一句话

日服 **CHUNITHM Mate** 本体是主数据源，Mate 的 **A300** 补充包是删除曲来源；国服 **X-VERSE** 的 HDD 留着做对照，不再作为谱师/定数的主来源。

## 1. 目录一览

| 用途 | 路径 | 数量 | 说明 |
|---|---|---|---|
| 日服 Mate 本体曲 | `D:\SDHD - CHUNITHM Mate\HDD\data\A000\music` | 1699 首 | `musicXXXX/` 下有 `Music.xml` + `XXXX_00.c2s`…`_04.c2s` + 曲绘 dds |
| 日服 Mate 删除曲 | `D:\SDHD - CHUNITHM Mate\HDD\bin\option\A300\music` | 529 首 | A300 补充包，见第 2 节；与本体 ID 重叠仅 6 首 |
| 日服 Mate 其他补充包 | `D:\SDHD - CHUNITHM Mate\HDD\bin\option\` | A001 / A071–A074 / A081 / A091–A093 / AKOP | 活动、联动、旧版本增量 |
| 国服 X-VERSE 本体 | `D:\XVX\HDD\data\A000\music` | 1595 首 | 和 Mate 重叠 1584 首；Mate 比它多 115 首 |
| 国服 X-VERSE 补充包 | `D:\XVX\HDD\bin\option\` | A001 / A241–A242 / A250–A252 / A260–A262 / A270–A272 / A281–A283 / A291–A293 / A300–A302 | 其中 A300 为 519 首（旧版排序），A301 7 首、A302 5 首 |
| 自制包（与删曲无关） | `D:\SDHD - CHUNITHM Mate\自制包\A999_260731_mate.zip` | 53 个条目 | 内容是 `A999/battleRatingRange` 等评级区间数据，**不含曲目**，别拿它当删曲包 |
| 旧谱师缓存 | `blog\_tmp\game\c2s-designers-all.json` | 8069 键 | 上一轮从 XVX + option 扫出来的 `musicId → 各难度 CREATOR`，可复用但需按 Mate 增量更新 |

数量核验（2026-11-15）：

- Mate 本体 1699 + A300 删曲 529 − 重叠 6 = **2222 个不同 musicId**
- 站内目前（2026-11-15 A300 对账后）：曲库 1855 首 + 删除曲 297 首 = 合计 2152 首

## 2. A300 补充包是什么

原文（随包发布）：

> A300 更新内容 - 260731
>
> 添加 CHUNITHM Mate 版本中的删除曲
>
> 对删除曲进行重新排序，由于官方在此版本中大幅修改了 “POP'S Anime”、“niconico”、“VARIETY” 分类的排序，所以新版本 A300 将不再按照之前版本的官方排序排列删除曲，将全部删除曲放到各自分类的队尾。
>
> 本补充包包含了从旧框初代无印开始到 Luminous Plus 为止的所有官方已删除歌曲及相关配套的资源，以及已删除 ULTIMA / World's End 谱面，并且删除曲部分已重新排序，非常老旧的歌曲会安排在每个分类的最末尾并按照 ID 编号从小到大排列，比较新的删除曲则按照删除前的官方排序。
>
> 本补充包并不包含已删除歌曲及相关配套的资源、删除谱面以外的任何已被官方在新版本删除的内容，比如联动地图……如需解锁相关角色请到 rin Net 网页后台相关功能中操作！

**对扫描的影响：**

- A300 里的 `music` 目录顺序 = 分类队尾 + ID 升序/旧排序混合，**不能**当作官方曲序或版本顺序使用
- 只用来取「哪些曲已删除」「删曲的谱面 / 定数 / 物量」，不要用它的目录顺序去推定分类顺序
- 删曲范围：无印 ~ Luminous Plus 的官方删除曲；包含被删除的 ULTIMA / WE 谱面
- 不包含联动地图、角色等非曲目内容

## 3. 字段从哪来

| 站点字段 | 来源 |
|---|---|
| 曲名 / 艺术家 / BPM | `Music.xml` 的 `<name>/<str>`、`<artistName>/<str>`、`<bpm>` |
| 分类（POPS & ANIME / niconico / VARIETY / 东方 / 原创 / 游戏） | `Music.xml` 的 `<genreName>` / `<genreId>` |
| 版本（无印 / … / X-VERSE / Mate） | `Music.xml` 的 `<releaseTagName>/<str>` + `chuni_ids.json` 对照；站点显示用 `VERSION_LABEL_FIX` 归一 |
| 等级（13+） | `Music.xml` 各难度 `<level>` |
| 定数（13.5） | `Music.xml` 的 `<levelDecimal>`（`internalValue`）；显示文本 `internal` 缺失时用 `tools/fix_internal_consts.mjs` 补 |
| 物量（tap/hold/slide/air/flick） | `Music.xml` 的 `<notesData>/<Notes>` 计数 |
| 谱面作者 | `.c2s` 文件头 `CREATOR` 字段；一节一张，`XXXX_00.c2s` 对应 BASIC，以此类推 |
| 删除曲 | Mate `A300\music` 里出现、`data\A000\music` 里没有的 ID |

## 4. 扫描约定（下一轮按这个来）

1. 主源固定读 **Mate**：`data\A000\music` + `bin\option\A300\music`；其他 option 包（A001、AKOP…）只在需要补活动曲/联动曲时单独看
2. 谱师以 `.c2s` 的 `CREATOR` 为准，先复用 `_tmp\game\c2s-designers-all.json`，只对 Mate 新增 / 变动的 ID 重扫
3. 国服 X-VERSE 仅用于「国服有没有这首」「国服定数是否不同」的对照，不覆盖日服数据
4. 每次扫描前先备份现有 JSON：`chuni.json`、`chuni_removed_songs.json`、`chuni_ids.json`、`chuni_designers.json`、`chuni_designer_alias.json`
5. 扫描脚本一律写成 `tools\*.mjs`，不要内联进 PowerShell

## 5. 已知坑

- 旧路径 `D:\XVX\HDD\option` **已不存在**，option 实际在 `D:\XVX\HDD\bin\option`
- Mate 的 `自制包\A999_260731_mate.zip` 名字像删曲包，实际是评级区间数据，没有曲目
- A300 的曲目顺序不是官方曲序（见第 2 节）
- 删曲 ID 会与本体部分重叠（当前 6 首），合并时按 musicId 去重
- `Music.xml` 是纯文本 SEGA XML，可直接 `ReadAllText` 后正则取字段，不需要解析二进制

## 6. 待办（等确认后再动）

- [ ] 用 Mate 本体 + A300 重扫一遍曲目信息（曲名、分类、版本、BPM、难度、定数、物量）
- [ ] 重扫新增谱面的 `.c2s` 谱师
- [ ] 核对删除曲列表：站内 140 首 vs A300 的 530 个目录（数量差很大，先确认站点只收录了一部分的原因）
- [ ] 国服 X-VERSE 差异对照（115 首 Mate 新增、11 首 XVX 独有）

## 7. 本地 JSON 与外部来源清单

> 2026-11-15 盘点。凡是「跑数据」先用这里的文件，不要重新凭记忆去找。

### 7.1 仓库内正在用的

| 文件 | 大小 | 用途 |
|---|---|---|
| `source/_data/chuni.json` | 2.4MB | 曲库主表，`songs` 1855 首；含 `id/title/artist/category/version/bpm/cover/sheets` |
| `source/_data/chuni_extra.json` | 5.3MB | wiki 介绍：`wiki_comment`（日文原文）、`wiki_comment_zh`（中文）、`titles/titles_zh`、`origins/origins_zh`、`history` |
| `source/_data/chuni_notes.json` | 644KB | 谱师留言（477 条，按曲名索引） |
| `source/_data/chuni_previews.json` | 913KB | 谱面预览图清单，键 = `musicId_难度序号`（8092 条） |
| `source/_data/chuni_designers.json` | 288KB | 每首每难度的谱面作者，键 = 曲名，值 = `{B,A,E,M,U,W}` |
| `source/_data/chuni_designer_alias.json` | 50KB | 别名表 953 条，`原文 → 归一后名字`（含 51 条 `A × B` 合作写法） |
| `source/_data/chuni_removed_songs.json` | 164KB | 删除曲 297 首（原 140 + A300 对账移入 157），`id` 形如 `REMOVED:<曲名>` |
| `source/_data/chuni_ids.json` | 65KB | 曲名 → 游戏 musicId（1990 条） |
| `source/_data/chuni_cn.json` | 263KB | 国服数据（4 条） |
| `source/_data/chuni_we.json` / `chuni_we_deleted.json` | 9.4KB / 6.1KB | WORLD'S END 谱面 |
| `source/_data/collab_parts.json` | 13.8KB | 合作分工表（28 首，按归一化曲名索引，`rows` 为「担当箇所 / 担当ND」） |
| `source/_data/collab_docx_titles.json` | 3.9KB | 谱师学 docx 抽出的合作曲白名单（166 首） |
| `source/_data/chuni_confirm.json` / `chuni_designer_fill.json` / `chuni_designer_fix.json` | 167KB / 132KB / 0.2KB | 人工校正、补名、单点修正 |
| `source/assets/data/collab.json` | 16.6KB | 每首每难度的合作参与者（167 首，用户逐条裁定后），`stats/ songs` |
| `source/assets/data/designers.json` | 518KB | 谱师 → 曲目倒排（49 位，1967 首），面板计数用 |
| `source/assets/data/collab-parts.json` | 13.8KB | 与 `_data/collab_parts.json` **内容相同**（见 8.11） |

### 7.2 `_tmp/` 底稿（不进仓库，但可复用）

| 类别 | 文件 |
|---|---|
| 全量曲目元数据 | `_tmp/chunithm-data.json`（4MB，`songs` 2011，含 `sheets`，旧快照）、`_tmp/data.json`（4MB）、`_tmp/SongInfo.json`（1.85MB）、`_tmp/lxns-songs.json`（1.4MB，落雪查分器，1466 首） |
| 定数 / 难度曲线 | `_tmp/kadai_difficulty.json`（1.42MB）、`_tmp/difficulty_curves.json`（1.19MB） |
| 标题 / HDD 扫描 | `_tmp/song_titles.json`（1.14MB）、`_tmp/hdd-music.json`（237KB）、`_tmp/hdd-music2.json`、`_tmp/new-pack-songs.json`、`_tmp/charts-removed.json`、`_tmp/hdd-we-charts.json` |
| 别的音游（查同名混淆） | `_tmp/sdvx-all.json`（1.45MB）、`_tmp/ongeki.json`（1.47MB） |
| 翻译 | `_tmp/zh.jsonl`（634KB）、`_tmp/zh-lines.jsonl`（674KB）、`_tmp/zh-fix.json`（288KB）、`_tmp/batch1–78-raw/translated.json` |
| 梗 / 由来 | `_tmp/neta-evidence-strict.json`（2.7MB）、`_tmp/neta-context.json`（1.8MB）、`_tmp/extra-origins-zh.jsonl`（359KB）、`_tmp/uniq-title.json`、`_tmp/uniq-cond.json` |
| wiki 抓取 | `_tmp/wiki-targets.json`（564KB）、`_tmp/wiki/`（songpage / addorder / songs）、`_tmp/wiki-*.html` |
| 谱师学 docx 抽出 | `_tmp/designers-all.json`、`_tmp/designers-parsed.json`、`_tmp/loose-for-docx.json`、`_tmp/designer_docx_report.txt` |
| 谱师留言报告 | `_tmp/nr_*.html`、`_tmp/nr_script*.js`、`_tmp/note_report_index.html` |
| 人工清单 docx | `_tmp/待确认清单.docx`、`谱师分类整理.docx`、`谱师分类-无归属谱面.docx`、`谱师留言-未匹配清单-4.docx`、`中二节奏曲库站维护说明.docx` |
| 文本参考 | `_tmp/refs/CHUNITHM.txt`、`_tmp/refs/用语.txt`、`_tmp/refs/梗.txt`、`_tmp/refs/copel` |
| 审计脚本 | `tools/audit_sources.mjs`、`audit_shapes.mjs`、`audit_conflicts*.mjs`（本次盘点用） |

### 7.3 网站

| 站点 | 用途 |
|---|---|
| `https://wikiwiki.jp/chunithmwiki/` | 曲目介绍、合作分工表、删除曲、谱师列表的主来源 |
| arcade-songs（zetaraku/arcade-songs 的产物） | 曲目元数据对照（版本、BPM、定数、物量）；`chuni.json` 的 `source` 字段就写着它 |
| `https://sdvx.in/` | 隔壁 SDVX 曲库，查同名/混淆曲 |
| `https://note-report.pages.dev/` | 谱师留言（谱面作者笔记）原始报告页 |
| B 站 | 官方动态、曲目投稿（`_tmp/bili_*.json/html`） |
| YouTube | 曲目试听链接（`source/_data/chuni_youtube.json`） |
| `https://decapbridge.com` | 后台 `/admin` 的 Git Gateway |
| `https://giscus.app` | 评论区（当前方案），数据在 GitHub Discussions |
| Waline + Vercel（已停用） | 试过的匿名评论方案，见 `docs/chuni-site-notes.md` |

### 7.4 GitHub 项目

| 项目 | 用途 |
|---|---|
| `QingQiz/MarisaBot` | 谱面渲染；`_tmp/marisa/repo` 是它的 `Marisa.Frontend`，预览图靠它出 |
| `zetaraku/arcade-songs` | 曲目元数据上游 |
| `giscus` | 评论区 |
| `willin/hexo-wordcount` | 主题的字数统计依赖 |
| `Baobao-owo/comment-data`（私有） | Waline 时期的评论数据，已弃用 |
| Release `chuni-previews-extra` | 谱面预览图存放（754+ 张，单 Release 上限 1000） |

## 8. 内部对撞清单（待逐条裁定）

> 这些是「同一件事有多个来源 / 多个口径」的地方。每条先写现状与证据，别急着改——等确认哪边是对的。

1. **`id` 不是 musicId。** `chuni.json` 里 `songs[].id` 存的是曲名（如 `B.B.K.K.B.K.K.`，WE 变体是 `(WE) B.B.K.K.B.K.K.`），真正 musicId 只在 `chuni_ids.json`。有 19 首查不到 musicId。任何要拼 `musicId_难度` 的对照（c2s、预览图、lxns）都得先过这张表，直接拿 `id` 当 musicId 会全错。
2. **曲名重复 146 组。** 2011 条记录只有 1855 个不同曲名：普通谱与 WORLD'S END 变体共用曲名（例：`B.B.K.K.B.K.K.` 与 `(WE) B.B.K.K.B.K.K.` 都是 `title: B.B.K.K.B.K.K.`）。而 `chuni_designers.json`、`chuni_extra.json`、`chuni_notes.json`、`chuni_ids.json`、`designers.json` 都按曲名索引——同名两首会互相覆盖，WE 变体可能读到本体数据。
3. **谱师：c2s 原文 vs 站内显示，1231 处不同。** 可对照 7185 张谱。多数差异是「称号/梗名」被别名表归一（`Cyberocher` → ロシェ＠ペンギン、`Unlimited Lemon!` → じゃこレモン、`Penguin...` → ロシェ＠ペンギン），但有至少 4 处是真名不同：`タイガーランペイジ` ULTIMA 为 `Panther Rampage`，站内写 ぴちネコ；`Lapis` ULTIMA 为 `Piercing Blade`，站内写 アミノハバキリ；`六兆年と一夜物語` ULTIMA 为 `ペンギンは人になりたかった`，站内写 ロシェ＠ペンギン；`鳥の詩` EXPERT 原文 `Jack supported by ロシェ＠ペンギン`，站内只留 ロシェ＠ペンギン。这跟「显示游戏原文」的原则冲突——ULTIMA 上现在显示的是归一后的名字。
4. **定数：站内 vs 落雪（lxns）35 处不一致。** 例：`Äventyr` MASTER 13.8 vs 14、`緋色のDance` MASTER 12.6 vs 13、`FLOWER` ADVANCED 6 vs 5、`Xevel` ADVANCED 8 vs 8.5、`Ai Nov` EXPERT 12.3 vs 12.5、`Pump!n` ADVANCED 6 vs 7、`PRIVATE SERVICE` ULTIMA 14.9 vs 15。其余 5540 张一致。
5. **删除曲数量三个口径。** 站内 `chuni_removed_songs.json` 140 首；Mate A300 目录 530 个（文档旧版写 529）；页面合计 2151 = 2011 + 140。A300 比站内多 390 首，待确认是「站内只收了有 wiki 介绍/封面的」还是漏了。
6. **版本字段 `null` 192 首**，另有 `VERSE` 与 `X-VERSE`、`CHUNITHM NEW` 与 `X-VERSE-X` 混用；`VERSION_LABEL_FIX` 只在生成端改显示，数据本身没统一。
7. **介绍缺 15 首。** `chuni_extra.json` 2145 条，曲库 2151 首，15 首查不到条目（`ODDS&ENDS`、`トリスメギストス`、`-OutsideR:RequieM-`、`Title`、`GEMINI -M-` …）；另有 2 条缺日文原文、2 条缺中文。
8. **预览图缺 88 张**（按 `musicId_难度` 计，7495 张应有）。
9. **谱师留言 477 条，只对上 466 首**（11 条按曲名找不到歌）；之前统计「537 首有留言」是重复标题被重复计数。
10. **合作判定四套并存。** `collab.json` 167 首、docx 白名单 166 首、分工表 28 首、别名表里 51 条 `A × B`（45 条进了显示）。2026-11-15 用户按「合作曲待裁定.xlsx」逐条判定后：21 首补了 per-diff 参与者，7 首归为单人并进 `tools/collab-exclude.json`（现 14 条）。。同一首可能 docx 说是合作、`collab.json` 却没有参与者。
11. **分工表存两份。** `source/_data/collab_parts.json` 与 `source/assets/data/collab-parts.json` 现在内容相同（构建读 `_data`），但两份分开维护，之前就出过「一份 5 条、一份 17 条」的事故。
12. **总数口径混用。** 2011（`chuni.json` 本体）、2151（含删除曲，页面显示）、1855（唯一曲名）三个数在不同文档/脚本里都出现过，写的时候要标清是哪个。
13. **翻译两套文件。** `batch1–78-raw/translated.json` 与 `zh-*.jsonl` 各自成体系，没有总索引，不知道哪批最后合进了 `chuni_extra.json`。
14. **cdata 没真正参与对照。** `_tmp/chunithm-data.json` 的 `sheets` 结构与站内不同（`type` 是数字/字符串混用），本次审计比对 0 条——它不是可用作定数校对的源。

## 9. A300 对账与国日服分离（2026-11-15 执行结果）

### 9.1 A300 528 个有效条目的去向

| 类别 | 数量 | 处理 |
|---|---|---|
| 与 Mate 本体重复（同 musicId） | 6 | 不算删除 |
| 已在删除曲列表 | 139 | 保持原样 |
| 站内仍标现存、musicId 相同 | 148 个曲名（156 条记录，8 组同名普通/WE 双条目） | 从 `chuni.json` 移入 `chuni_removed_songs.json`，`removedFromMate: true` |
| WORLD'S END 专属条目（8xxx / ID_ 谱） | 235 | 不进普通删曲表，走 WE 数据；其中 `779 WORLD'S END` 本身是普通曲，已作为删除曲导入 |
| 合计 | 528 | |

- 处理脚本：`tools/check_a300.mjs`（分类）→ `tools/move_a300_removed.mjs`（迁移，先备份到 `_tmp/chuni.before-a300.json`）。
- 结果：曲库 2011 → 1855，删除曲 140 → 297，页面合计 2152。
- 删曲列表里的 `cover` 沿用原现役条目的封面 URL（cloudfront），没有重新转 webp。

### 9.2 版本回填

- `tools/scan_music_xml.mjs` 扫 Mate 本体 + A300 + XVX 本体 + XVX A300，输出 `_tmp/game/music-xml.json`（含 artist / genre / releaseDate / releaseTag / 各难度 level+levelDecimal）。
- `tools/analyze_xml.mjs` 从 21 条 releaseTag 学到站内版本名，`tools/apply_version_backfill.mjs` 回填 182 首；剩 10 首是 2025 新曲，本地两个 HDD 没有对应 XML，需要等新包。

### 9.3 国服 / 日服定数分开存

- 同 musicId 可比 6798 张，44 张不同（41 首），差异写入 `source/_data/chuni_cn_consts.json`（只存不同的难度）。
- 曲目详情页「定数」列在日服值下面补一行「国服 x.xx」（`.chuni-iv-cn`），不改变筛选、排序用的日服数值。
- 明细：`_tmp/reports/cn-vs-jp-consts.tsv`。已知差异多为 XVX 与 Mate 版本调整（Äventyr MASTER 14.00 / 13.80、緋色のDance MASTER 13.00 / 12.60、Xevel ADVANCED 8.50 / 8.00）。

### 9.4 对撞清单的落点

- 第 5 条（删除曲数量）：已按上表拆清，530 是目录数，实际新删曲 157 条。
- 第 6 条（版本 null）：182 首回填，剩 10 首无 XML。
- 第 4 条（国日服定数）：拆成两份，互不覆盖。
- 第 3 条（谱师原文）：现役与删曲都显示 c2s 原文，筛选走 `chuni_designer_alias.json`。

## 10. 2026-11-15 裁定执行记录（续）

- **#14 chunithm-data.json**：\	ools/normalize_chunithm_data.mjs\ 把它摊平成 title → per-diff 定数，与站内 6355 张可比，只有 7 处不同（\_tmp/reports/mirror-const-diff.tsv\：FLOWER adv/mas、Over Heart 四张、狂命 mas）。结论：**可用作第三方参考，不直接回写**。
- **#13 翻译索引**：\	ools/build_translation_index.mjs\ 扫 143 个 batch*.json → \	ools/translation-index.json\（9365 条，介绍 6161 / 由来 2026 / 称号 1177 / 紹介 1，去重 63；另有 \_tmp/zh-lines.jsonl\ 1213 个 id 的中文整段）。译文已经落到 \chuni_extra.json\ 的 \wiki_comment_zh / titles_zh / origins_zh\。
- **#8 预览缺口**：按 \<musicId>_<0-4>\ 口径只有 12 张缺（ドーナツホール等 4 张 ULTIMA、Garakuta remix 4 张、WORLD'S END 779 四张）；另有 76 张 WE-only 行没有 musicId。本地两个 HDD 的 \music\ 目录现在只剩 MusicSort.xml，c2s 已不在原处，需要重新解包或指定目录才能补。
- **目录变化**：日服现在是 \D:\SDHD - CHUNITHM Mate\HDD\{data,bin\option}\（多了一层 HDD）；旧路径 \D:\SDHD - CHUNITHM Mate\data\...\ 已不存在。

### 2026-11-15 补记：5 首缺介绍已补

- 全部抓自日文 wiki，页面名与曲名不一致的记在这里：ODDS&ENDS → ODDS＆ENDS（全角 &）、トリスメギストス → トリスメギストス(楽曲名)、-OutsideR:RequieM- → 同曲名（冒号是全角）、ウルガレオン → ウルガレオン(楽曲名)、≠彡"/了→ → キミツアー。
- 写入 chuni_extra.json 时**两个键都要写**：wiki_comment 实际读取的是 extra[String(s.id)]，而 id 是曲名不是 musicId；只写数字 musicId 键页面会显示「wiki 的曲目介绍还没搬」。
- Over Heart 定数差异是同类曲名撞车：站内 Over Heart（イロドリミドリ）与 Overhea[r]t（ORIGINAL）不同曲，镜像按标题匹配会串。

### 待办：c2s 素材位置

- 2026-11-15 检查时，D:\SDHD - CHUNITHM Mate\HDD\data\A000\music 与 D:\XVX\HDD\data\A000\music 下都只剩 GenreSort.xml / MusicSort.xml，c2s 不在原处；日服多了一层 HDD 目录。
- 影响：剩余 12 张预览（_tmp/reports/preview-missing.tsv）暂时无法渲染，等用户重新解包或指定目录。
