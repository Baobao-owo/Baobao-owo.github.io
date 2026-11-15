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
- 站内目前：曲库 2151 首 + 删除曲 142 首

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
- [ ] 核对删除曲列表：站内 142 首 vs A300 的 529 首（数量差很大，先确认站点只收录了一部分的原因）
- [ ] 国服 X-VERSE 差异对照（115 首 Mate 新增、11 首 XVX 独有）
