# tools 脚本索引

维护曲库站用的 Node / Python 脚本都放在这里。**开工前先读 `AGENTS.md` 与 `docs/chuni-data-sources.md`**，本文件只是索引。

## 目录约定

- 正式脚本：无前缀，按功能命名（`scan_*` / `build_*` / `merge_*` / `fetch_*` / `fix_*`）。
- 一次性脚本：`_` 前缀（如 `_cv.mjs`），跑完就废，不要求维护。
- 中间产物一律写 `_tmp/`；`tools/out/`、`tools/queues/`、`tools/translation-index.json` 是生成物，已在 `.gitignore` 里。
- 脚本必须能重复跑：先读源数据、再算差异、最后才写回；写回前备份到 `_tmp/`。

## 常用脚本

| 脚本 | 作用 | 用法 |
| --- | --- | --- |
| `scan_music_xml.mjs` | 扫两个 HDD 的 Music.xml（动态枚举 option 下所有包） | `node tools/scan_music_xml.mjs` |
| `scan_c2s_recursive.mjs` | 递归扫全盘 c2s，找清单里缺但本地有谱面的曲 | `npm run scan:c2s` |
| `extract_c2s_creators.mjs` | 从 c2s 头部 CREATOR 提谱师 | `node tools/extract_c2s_creators.mjs <目录>` |
| `fill_designers_from_c2s.mjs` | 把 c2s 谱师补进 chuni_designers.json | `node tools/fill_designers_from_c2s.mjs` |
| `fix_internal_consts.mjs` | 补 internal 定数字符串（跳过 WE） | `node tools/fix_internal_consts.mjs` |
| `build_designers_merged.mjs` | 生成 designers.json（曲数/别名/songs 索引） | `node tools/build_designers_merged.mjs` |
| `build_designer_alias.mjs` | 生成 chuni_designer_alias.json（原文→归一） | `node tools/build_designer_alias.mjs` |
| `build_collab_from_docx.mjs` | 从谱师学 docx 抽合作曲 | `node tools/build_collab_from_docx.mjs` |
| `merge_collab_docx.mjs` | 把 docx 结果并进 collab.json | `node tools/merge_collab_docx.mjs` |
| `build_collab_titles.mjs` | 生成合作曲白名单 | `node tools/build_collab_titles.mjs` |
| `sync_collab_parts.mjs` | 校验/同步两份 collab_parts.json | `node tools/sync_collab_parts.mjs [--write]` |
| `fetch_parts_pages.mjs` | 抓 wiki 分工表页面 | `node tools/fetch_parts_pages.mjs` |
| `scan_parts_all.mjs` | 解析抓下来的分工表 | `node tools/scan_parts_all.mjs` |
| `merge_parts_into_collab.mjs` | 把分工表并入 collab-parts / collab | `node tools/merge_parts_into_collab.mjs` |
| `merge_a300_we.mjs` | A300 的 WE 谱并入 chuni_we（冲突以 A300 为准） | `node tools/merge_a300_we.mjs [--write]` |
| `sync_we_from_wiki.mjs` | 抓 wiki 的 WORLD 模式表做对照/冲突 | `node tools/sync_we_from_wiki.mjs` |
| `check_a300.cjs` | A300 与站内比对分类（差集/同名/新曲） | `node tools/check_a300.cjs` |
| `move_a300_removed.mjs` | 把 A300 删曲从现役移到 removed | `node tools/move_a300_removed.mjs` |
| `apply_version_backfill.mjs` | 用 Music.xml 回填版本 | `node tools/apply_version_backfill.mjs` |
| `build_cn_consts.mjs` | 生成国服定数差异表 | `node tools/build_cn_consts.mjs` |
| `render_new_previews.mjs` | 渲染谱面预览并上传 Release | `node tools/render_new_previews.mjs <c2s目录>` |
| `fetch_intro_pages.mjs` | 抓 wiki 曲目介绍 | `node tools/fetch_intro_pages.mjs` |
| `build_translation_index.mjs` | 汇总翻译批次成索引（产物已忽略） | `node tools/build_translation_index.mjs` |
| `audit_actions.mjs` | 生成各类对账 TSV 到 _tmp/reports | `node tools/audit_actions.mjs` |
| `analyze_xml.mjs` | Music.xml ↔ 站内版本/定数/删曲分析 | `node tools/analyze_xml.mjs` |
| `set_sheet_designer.mjs` | 改单张谱的谱面作者 | `node tools/set_sheet_designer.mjs <曲名> <难度> <作者>` |
| `make_site_notes_docx.py` | 曲库站维护说明导出 Word | `python tools/make_site_notes_docx.py` |

## 全部脚本（按功能粗分，一个脚本可能落多组）

### 谱师 / 别名 / 合作（73）

`_fix_new_song_designers.mjs` · `apply_collab_decisions.mjs` · `apply_collab_names_to_map.mjs` · `apply_collab_parts_filter.mjs` · `apply_manual_collab.mjs` · `apply_split_aliases.mjs` · `apply_we_names.mjs` · `build_collab.py` · `build_collab_exclude.mjs` · `build_collab_from_docx.mjs` · `build_collab_from_loose.mjs` · `build_collab_parts.mjs` · `build_collab_titles.mjs` · `build_collab_unique_match.mjs` · `build_designer_alias.mjs` · `build_designer_fill.mjs` · `build_designer_from_comments.mjs` · `build_designer_we.mjs` · `build_designers.mjs` · `build_designers_info.mjs` · `build_designers_merged.mjs` · `build_wiki_aliases.mjs` · `build_wiki_unknown_collab.mjs` · `check_circus_collab.mjs` · `check_circus_collab2.mjs` · `check_pichineko_alias.mjs` · `check_pichineko_alias2.mjs` · `clean_collab.mjs` · `clean_collab_names.mjs` · `debug_alias_match.mjs` · `debug_collab_pick.mjs` · `designer_lexicon.mjs` · `fetch_all_collab_pages.mjs` · `fetch_collab_pages.mjs` · `fetch_missing_collab_pages.mjs` · `fetch_parts_pages.mjs` · `fill_designers_from_c2s.mjs` · `find_missing_collab_pages.mjs` · `fix_placeholder_credits.mjs` · `fix_toy_parts.mjs` · `import_chuni_designers.mjs` · `import_parts_from_origins.mjs` · `list_questionable_collab.mjs` · `make_collab_pending_docx.py` · `make_collab_questions_docx.py` · `make_designer_report.py` · `merge_c2s_designers.mjs` · `merge_collab_docx.mjs` · `merge_parts_into_collab.mjs` · `normalize_collab_keys.mjs` · `polish_char_names.mjs` · `rebuild_collab.mjs` · `scan_c2s_designers.mjs` · `scan_parts_all.mjs` · `set_sheet_designer.mjs` · `shot_collab_parts.mjs` · `shot_parts_section.mjs` · `split_collab_credits.mjs` · `sync_collab_parts.mjs` · `sync_designers_to_map.mjs` · `test_collab_both_sides.mjs` · `test_collab_combo.mjs` · `test_collab_const_sort.mjs` · `test_collab_entries.mjs` · `test_collab_parts_filter.mjs` · `test_collab_toggle.mjs` · `test_designer_badge.mjs` · `test_designer_filter.mjs` · `test_designer_level.mjs` · `test_unwelcome_collab.mjs` · `upload_previews_by_name.mjs` · `verify_collab_decisions.mjs` · `verify_collab_live.mjs`

### 曲库数据 / 版本 / 定数（50）

`_assign_we_jokes.mjs` · `_patch_we_preview.mjs` · `analyze_xml.mjs` · `apply_song_credits.mjs` · `apply_version_backfill.mjs` · `backfill_chuni_desc.mjs` · `backfill_chuni_video.mjs` · `build_chuni_notes.mjs` · `build_cn_consts.mjs` · `build_new_songs.mjs` · `build_removed_songs.mjs` · `build_song_addorder.mjs` · `build_song_dates.mjs` · `build_we_deleted_data.mjs` · `check_a300.cjs` · `crawl_deleted_songs.ps1` · `fix_internal_consts.mjs` · `fix_removed_ids.mjs` · `fix_symbol_song.mjs` · `fix_title_translations.mjs` · `import_chuni.mjs` · `import_chuni_confirm.mjs` · `import_chuni_ids.mjs` · `import_chuni_songs.mjs` · `import_new_songs.mjs` · `import_song_wiki.mjs` · `import_we_wiki.mjs` · `merge_a300_we.mjs` · `move_a300_removed.mjs` · `normalize_chunithm_data.mjs` · `parse_song_credits.mjs` · `render_chuni_charts.mjs` · `render_we_charts.mjs` · `render_we_hdd.mjs` · `scan_game_music.mjs` · `scan_music_xml.mjs` · `scan_new_songs.mjs` · `scan_song_tables.mjs` · `shot_chuni_default.mjs` · `shot_chuni_filters.mjs` · `shot_chuni_order.mjs` · `shot_mobile_song.mjs` · `shot_song_tables.mjs` · `shot_song_zh.mjs` · `sync_chuni_ids.mjs` · `sync_we_from_wiki.mjs` · `test_const_sort.mjs` · `title_match.mjs` · `trim_title_notes.mjs` · `we_copy.mjs`

### 预览 / 图片（21）

`_crop_opus_imgs.py` · `_download_opus_imgs.mjs` · `_opus_images.mjs` · `_pngify_opus.py` · `build_preview_manifest.mjs` · `chart_svg.py` · `png_to_webp.py` · `reconcile_previews.mjs` · `render_all_charts.mjs` · `render_bot_chart.mjs` · `render_charts_worker.mjs` · `render_from_option.mjs` · `render_missing_charts.mjs` · `render_new_previews.mjs` · `render_removed_previews.mjs` · `render_we2.mjs` · `scrape_opus_images.mjs` · `shot_chart.mjs` · `upload_previews.mjs` · `upload_previews_release.mjs` · `upload_removed_previews.mjs`

### 翻译 / 介绍 / wiki（51）

`_add_manual_batch.mjs` · `_patch_batch2_wording.mjs` · `_wiki_probe.mjs` · `apply_rule_translations.mjs` · `apply_translations.mjs` · `build_batch2_docx.py` · `build_batch2_docx_v2.py` · `build_batch_sample.py` · `build_batch_verified.py` · `build_translation_index.mjs` · `build_wiki_page_index.mjs` · `dump_batch2.mjs` · `export_extra_translations.mjs` · `export_zh_fix.mjs` · `export_zh_lines.mjs` · `export_zh_pending.mjs` · `export_zh_tokens.mjs` · `extract_c2s_creators.mjs` · `extract_removed_intros.mjs` · `fetch_intro_pages.mjs` · `fetch_wiki_page.mjs` · `gh_translate.mjs` · `make_wiki_candidates.mjs` · `mark_deleted_from_wiki.mjs` · `merge_char_zh.mjs` · `merge_extra_translations.mjs` · `merge_removed_intros.mjs` · `ocr_batch.ps1` · `parse_new_wiki_info.mjs` · `rule_translate.mjs` · `survey_intro_shapes.mjs` · `translate_batch.mjs` · `translate_batch.ps1` · `translate_batch8.mjs` · `translate_lines.ps1` · `translate_merge.mjs` · `translate_pending.ps1` · `translate_when_ready.ps1` · `verify_batch_sample.mjs` · `wiki_build.mjs` · `wiki_extra_sections.mjs` · `wiki_fetch.ps1` · `wiki_fetch_browser.mjs` · `wiki_fetch_shard.ps1` · `wiki_fetch_slow.ps1` · `wiki_history_expand.mjs` · `wiki_keep.mjs` · `wiki_retry_browser.mjs` · `wiki_targets.mjs` · `wiki_targets_all.mjs` · `wiki_translate.mjs`

### 抓取 / 网络（21）

`_bili_opus_list.mjs` · `_gen_opus_inspect.mjs` · `_opus_text_probe.mjs` · `_scan_ocr.mjs` · `convert_opus_md.py` · `fetch_addorder_pages.mjs` · `fetch_bili_cover.mjs` · `fetch_bili_opus.mjs` · `fetch_copel_stories.mjs` · `fetch_missing_via_index.mjs` · `fetch_ref_more.mjs` · `fetch_ref_pages.mjs` · `fetch_set.mjs` · `fetch_unithm_lore.mjs` · `import_bili_opus.mjs` · `scan_c2s_recursive.mjs` · `scan_new_pack.mjs` · `scrape_bili_api.mjs` · `scrape_cn_opus_list.mjs` · `shot_bili_card.mjs` · `shot_bili_post.mjs`

### 报告 / 文档 / 检查（34）

`_check_unknown.mjs` · `_logincheck.mjs` · `audit_actions.mjs` · `audit_conflicts.mjs` · `audit_conflicts2.mjs` · `audit_conflicts3.mjs` · `audit_conflicts4.mjs` · `audit_conflicts5.mjs` · `audit_shapes.mjs` · `audit_sources.mjs` · `build_cn_removed_docx.py` · `build_decision_docx.py` · `build_fail_docx.py` · `build_glossary_docx.py` · `build_glossary_docx_v5.py` · `build_glossary_docx_v6.py` · `build_glossary_docx_v7.py` · `build_glossary_docx_v8.py` · `build_neta_review_docx.py` · `build_neta_strict_docx.py` · `check_login_flow.mjs` · `dump_filled_docx.py` · `index_copel_stories.mjs` · `make_conflicts_docx.py` · `make_cover.py` · `make_loose_docx.py` · `make_site_notes_docx.py` · `make_todo_docx.py` · `make_unassigned_report.py` · `make_unmatched_docx.py` · `parse_note_reports.mjs` · `probe_note_reports.mjs` · `shot_check_comments.mjs` · `verify_glossary.mjs`

### 其他（78）

`_assign_last_loose.mjs` · `_cv.mjs` · `_lb_zoom_test.mjs` · `_merge_ichinose.mjs` · `_patch_kyoumei.mjs` · `_patch_kyoumei_level.mjs` · `_probe_unknown.mjs` · `_readd_ichinose.mjs` · `apply-categories.mjs` · `build_char_map.mjs` · `build_cn_removed.mjs` · `build_glossary.mjs` · `build_glossary_localize.py` · `build_manual.py` · `build_neta_context.mjs` · `build_neta_evidence.mjs` · `build_neta_evidence_strict.mjs` · `census_stats.mjs` · `convert_removed_covers.py` · `debug_dz_chip.mjs` · `deploy_pages.ps1` · `diag_giscus.mjs` · `dom.mjs` · `export_cell_queues.mjs` · `finalize_census.mjs` · `fix_same_person_credits.mjs` · `glossary_auto_fill.mjs` · `glossary_fix_seed.mjs` · `import_lxns_cn.mjs` · `import_new_notes.mjs` · `import_osu_maps.mjs` · `import_sdvx_removed.mjs` · `import_sdvx_youtube.mjs` · `inspect.mjs` · `list_suspicious_credits.mjs` · `list_unmatched_notes.mjs` · `measure_mobile_row.mjs` · `measure_mobile_rows.mjs` · `measure_toolbar.mjs` · `merge_cells.mjs` · `merge_lines.mjs` · `merge_tokens.mjs` · `neta_census.mjs` · `neta_census2.mjs` · `neta_research.mjs` · `ocr_win.ps1` · `overnight_full.ps1` · `parse_all_addorder.mjs` · `parse_deleted_pages.mjs` · `read_green_rows.py` · `rebuild_glossary.mjs` · `retry_missing_pages.mjs` · `run_full_import.ps1` · `scrape_cn_official_dynamic.mjs` · `shot.mjs` · `shot_admin.mjs` · `shot_cat_page.mjs` · `shot_comment_full.mjs` · `shot_comment_onpage.mjs` · `shot_comments.mjs` · `shot_confirm_rows.mjs` · `shot_landing.mjs` · `shot_levels.mjs` · `shot_live.mjs` · `shot_mobile_list.mjs` · `shot_mobile_top.mjs` · `shot_toolbar2.mjs` · `shot_toolbar_layout.mjs` · `shot_toolbar_narrow.mjs` · `shot_widget.mjs` · `suggest_unmatched.mjs` · `survey_skipped_shapes.mjs` · `test_cn_removed.mjs` · `test_cn_removed2.mjs` · `test_irony.mjs` · `test_list_state_restore.mjs` · `test_star_chips.mjs` · `test_unmatched_hidden.mjs`

## 新增脚本

1. 文件头写一行 `// 干什么、读什么、写什么`，不然半年后自己也不认识。
2. 输出走 `_tmp/`，不要直接改 `source/_data`（除非脚本名就是 `apply_*` 且带备份）。
3. 改数据前先产出差异清单（TSV / Excel），再按 `AGENTS.md` 的「数据冲突处理」流程走。
4. 一次性脚本加 `_` 前缀，别混进正式流水线。
