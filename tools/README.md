# tools 脚本索引

维护曲库站用的脚本。**开工前先读 `AGENTS.md` 与 `docs/chuni-data-sources.md`**，本文件只是索引。

## 目录结构

| 目录 | 放什么 | 数量 |
| --- | --- | --- |
| `tools/data/` | 数据构建与写回（build / apply / merge / fix / sync / move） | 99 |
| `tools/fetch/` | 抓取与扫描（fetch / scan / scrape / 提取） | 39 |
| `tools/previews/` | 谱面预览渲染与截图 | 45 |
| `tools/reports/` | 对账报告、审计、检查、Word/Excel 导出 | 70 |
| `tools/translate/` | 翻译与术语表相关 | 5 |
| `tools/legacy/` | `_` 前缀的一次性脚本，跑完就废，不维护 | 17 |
| `tools/`（根） | 共享模块、数据 js、README；被别的脚本 import 的必须留在根 | 53 |

根目录留着的共享脚本：`_add_manual_batch.mjs` · `_assign_last_loose.mjs` · `_assign_we_jokes.mjs` · `_check_unknown.mjs` · `_fix_new_song_designers.mjs` · `_merge_ichinose.mjs` · `_readd_ichinose.mjs` · `apply_collab_decisions.mjs` · `apply_manual_collab.mjs` · `apply_split_aliases.mjs` · `build_collab_exclude.mjs` · `build_collab_from_docx.mjs` · `build_collab_from_loose.mjs` · `build_collab_unique_match.mjs` · `build_decision_docx.py` · `build_designer_alias.mjs` · `build_designer_fill.mjs` · `build_designer_from_comments.mjs` · `build_designer_we.mjs` · `build_designers.mjs` · `build_designers_merged.mjs` · `build_neta_evidence.mjs` · `build_neta_review_docx.py` · `build_song_addorder.mjs` · `build_song_dates.mjs` · `build_translation_index.mjs` · `build_wiki_aliases.mjs` · `build_wiki_unknown_collab.mjs` · `chart_svg.py` · `deploy_pages.ps1` · `designer_lexicon.mjs` · `dom.mjs` · `finalize_census.mjs` · `fix_same_person_credits.mjs` · `glossary_auto_fill.mjs` · `import_new_songs.mjs` · `ocr_batch.ps1` · `ocr_win.ps1` · `overnight_full.ps1` · `parse_all_addorder.mjs` · `rebuild_collab.mjs` · `rebuild_glossary.mjs` · `render_chuni_charts.mjs` · `run_full_import.ps1` · `split_collab_credits.mjs` · `translate_batch.mjs` · `translate_batch.ps1` · `translate_lines.ps1` · `translate_merge.mjs` · `translate_when_ready.ps1` · `wiki_build.mjs` · `wiki_extra_sections.mjs` · `wiki_history_expand.mjs`。

## 常用脚本

| 脚本 | 作用 | 用法 |
| --- | --- | --- |
| `scan_music_xml.mjs` | 扫两个 HDD 的 Music.xml（动态枚举 option 下所有包） | `node tools/fetch/scan_music_xml.mjs` |
| `scan_c2s_recursive.mjs` | 递归扫全盘 c2s，找清单里缺但本地有谱面的曲 | `npm run scan:c2s` |
| `extract_c2s_creators.mjs` | 从 c2s 头部 CREATOR 提谱师 | `node tools/fetch/extract_c2s_creators.mjs <目录>` |
| `fill_designers_from_c2s.mjs` | 把 c2s 谱师补进 chuni_designers.json | `node tools/data/fill_designers_from_c2s.mjs` |
| `fix_internal_consts.mjs` | 补 internal 定数字符串（跳过 WE） | `node tools/data/fix_internal_consts.mjs` |
| `build_designers_merged.mjs` | 生成 designers.json（曲数/别名/songs 索引） | `node tools/data/build_designers_merged.mjs` |
| `build_designer_alias.mjs` | 生成 chuni_designer_alias.json（原文→归一） | `node tools/data/build_designer_alias.mjs` |
| `build_collab_from_docx.mjs` | 从谱师学 docx 抽合作曲 | `node tools/data/build_collab_from_docx.mjs` |
| `merge_collab_docx.mjs` | 把 docx 结果并进 collab.json | `node tools/data/merge_collab_docx.mjs` |
| `build_collab_titles.mjs` | 生成合作曲白名单 | `node tools/data/build_collab_titles.mjs` |
| `sync_collab_parts.mjs` | 校验/同步两份 collab_parts.json | `node tools/data/sync_collab_parts.mjs [--write]` |
| `fetch_parts_pages.mjs` | 抓 wiki 分工表页面 | `node tools/fetch/fetch_parts_pages.mjs` |
| `scan_parts_all.mjs` | 解析抓下来的分工表 | `node tools/fetch/scan_parts_all.mjs` |
| `merge_parts_into_collab.mjs` | 把分工表并入 collab-parts / collab | `node tools/data/merge_parts_into_collab.mjs` |
| `merge_a300_we.mjs` | A300 的 WE 谱并入 chuni_we（冲突以 A300 为准） | `node tools/data/merge_a300_we.mjs [--write]` |
| `sync_we_from_wiki.mjs` | 抓 wiki 的 WORLD 模式表做对照/冲突 | `node tools/data/sync_we_from_wiki.mjs` |
| `check_a300.cjs` | A300 与站内比对分类（差集/同名/新曲） | `node tools/reports/check_a300.cjs` |
| `move_a300_removed.mjs` | 把 A300 删曲从现役移到 removed | `node tools/data/move_a300_removed.mjs` |
| `apply_version_backfill.mjs` | 用 Music.xml 回填版本 | `node tools/data/apply_version_backfill.mjs` |
| `build_cn_consts.mjs` | 生成国服定数差异表 | `node tools/data/build_cn_consts.mjs` |
| `render_new_previews.mjs` | 渲染谱面预览并上传 Release | `node tools/previews/render_new_previews.mjs <c2s目录>` |
| `fetch_intro_pages.mjs` | 抓 wiki 曲目介绍 | `node tools/fetch/fetch_intro_pages.mjs` |
| `build_translation_index.mjs` | 汇总翻译批次成索引（产物已忽略） | `node tools/data/build_translation_index.mjs` |
| `audit_actions.mjs` | 生成各类对账 TSV 到 _tmp/reports | `node tools/reports/audit_actions.mjs` |
| `analyze_xml.mjs` | Music.xml ↔ 站内版本/定数/删曲分析 | `node tools/reports/analyze_xml.mjs` |
| `set_sheet_designer.mjs` | 改单张谱的谱面作者 | `node tools/data/set_sheet_designer.mjs <曲名> <难度> <作者>` |
| `make_site_notes_docx.py` | 曲库站维护说明导出 Word | `python tools/reports/make_site_notes_docx.py` |

## 约定

- 脚本之间**不要互相 spawn**；需要复用的逻辑抽成模块放根目录。
- 路径一律相对仓库根（`process.cwd()`），不写死盘符；脚本里不写 `__dirname` 拼绝对路径。
- 中间产物写 `_tmp/`；`tools/out/`、`tools/queues/`、`tools/translation-index.json` 是生成物，已忽略。
- 写回数据前先备份到 `_tmp/`，并产出差异清单（TSV/Excel）走裁定流程。
- 一次性脚本放 `legacy/`，加 `_` 前缀。

## 各目录清单

### data（99）

`apply-categories.mjs` · `apply_collab_names_to_map.mjs` · `apply_collab_parts_filter.mjs` · `apply_rule_translations.mjs` · `apply_song_credits.mjs` · `apply_translations.mjs` · `apply_version_backfill.mjs` · `apply_we_names.mjs` · `backfill_chuni_desc.mjs` · `backfill_chuni_video.mjs` · `build_batch2_docx.py` · `build_batch2_docx_v2.py` · `build_batch_sample.py` · `build_batch_verified.py` · `build_char_map.mjs` · `build_chuni_notes.mjs` · `build_cn_consts.mjs` · `build_cn_removed.mjs` · `build_cn_removed_docx.py` · `build_collab.py` · `build_collab_parts.mjs` · `build_collab_titles.mjs` · `build_designers_info.mjs` · `build_fail_docx.py` · `build_glossary.mjs` · `build_glossary_docx.py` · `build_glossary_docx_v5.py` · `build_glossary_docx_v6.py` · `build_glossary_docx_v7.py` · `build_glossary_docx_v8.py` · `build_glossary_localize.py` · `build_manual.py` · `build_neta_context.mjs` · `build_neta_evidence_strict.mjs` · `build_neta_strict_docx.py` · `build_new_songs.mjs` · `build_removed_songs.mjs` · `build_we_deleted_data.mjs` · `build_wiki_page_index.mjs` · `clean_collab.mjs` · `clean_collab_names.mjs` · `convert_opus_md.py` · `convert_removed_covers.py` · `dump_batch2.mjs` · `dump_filled_docx.py` · `fill_designers_from_c2s.mjs` · `fix_internal_consts.mjs` · `fix_placeholder_credits.mjs` · `fix_removed_ids.mjs` · `fix_symbol_song.mjs` · `fix_title_translations.mjs` · `fix_toy_parts.mjs` · `import_bili_opus.mjs` · `import_chuni.mjs` · `import_chuni_confirm.mjs` · `import_chuni_designers.mjs` · `import_chuni_ids.mjs` · `import_chuni_songs.mjs` · `import_lxns_cn.mjs` · `import_new_notes.mjs` · `import_osu_maps.mjs` · `import_parts_from_origins.mjs` · `import_sdvx_removed.mjs` · `import_sdvx_youtube.mjs` · `import_song_wiki.mjs` · `import_we_wiki.mjs` · `index_copel_stories.mjs` · `mark_deleted_from_wiki.mjs` · `merge_a300_we.mjs` · `merge_c2s_designers.mjs` · `merge_cells.mjs` · `merge_char_zh.mjs` · `merge_collab_docx.mjs` · `merge_extra_translations.mjs` · `merge_lines.mjs` · `merge_parts_into_collab.mjs` · `merge_removed_intros.mjs` · `merge_tokens.mjs` · `move_a300_removed.mjs` · `neta_census.mjs` · `neta_census2.mjs` · `neta_research.mjs` · `normalize_chunithm_data.mjs` · `normalize_collab_keys.mjs` · `parse_deleted_pages.mjs` · `parse_new_wiki_info.mjs` · `parse_note_reports.mjs` · `parse_song_credits.mjs` · `polish_char_names.mjs` · `set_sheet_designer.mjs` · `sync_chuni_ids.mjs` · `sync_collab_parts.mjs` · `sync_designers_to_map.mjs` · `sync_we_from_wiki.mjs` · `trim_title_notes.mjs` · `we_copy.mjs` · `wiki_keep.mjs` · `wiki_targets.mjs` · `wiki_targets_all.mjs`

### fetch（39）

`crawl_deleted_songs.ps1` · `extract_c2s_creators.mjs` · `extract_removed_intros.mjs` · `fetch_addorder_pages.mjs` · `fetch_all_collab_pages.mjs` · `fetch_bili_cover.mjs` · `fetch_bili_opus.mjs` · `fetch_collab_pages.mjs` · `fetch_copel_stories.mjs` · `fetch_intro_pages.mjs` · `fetch_missing_collab_pages.mjs` · `fetch_missing_via_index.mjs` · `fetch_parts_pages.mjs` · `fetch_ref_more.mjs` · `fetch_ref_pages.mjs` · `fetch_set.mjs` · `fetch_unithm_lore.mjs` · `fetch_wiki_page.mjs` · `find_missing_collab_pages.mjs` · `gh_translate.mjs` · `probe_note_reports.mjs` · `retry_missing_pages.mjs` · `scan_c2s_designers.mjs` · `scan_c2s_recursive.mjs` · `scan_game_music.mjs` · `scan_music_xml.mjs` · `scan_new_pack.mjs` · `scan_new_songs.mjs` · `scan_parts_all.mjs` · `scan_song_tables.mjs` · `scrape_bili_api.mjs` · `scrape_cn_official_dynamic.mjs` · `scrape_cn_opus_list.mjs` · `scrape_opus_images.mjs` · `wiki_fetch.ps1` · `wiki_fetch_browser.mjs` · `wiki_fetch_shard.ps1` · `wiki_fetch_slow.ps1` · `wiki_retry_browser.mjs`

### previews（45）

`build_preview_manifest.mjs` · `png_to_webp.py` · `reconcile_previews.mjs` · `render_all_charts.mjs` · `render_bot_chart.mjs` · `render_charts_worker.mjs` · `render_from_option.mjs` · `render_missing_charts.mjs` · `render_new_previews.mjs` · `render_removed_previews.mjs` · `render_we2.mjs` · `render_we_charts.mjs` · `render_we_hdd.mjs` · `shot.mjs` · `shot_admin.mjs` · `shot_bili_card.mjs` · `shot_bili_post.mjs` · `shot_cat_page.mjs` · `shot_chart.mjs` · `shot_check_comments.mjs` · `shot_chuni_default.mjs` · `shot_chuni_filters.mjs` · `shot_chuni_order.mjs` · `shot_collab_parts.mjs` · `shot_comment_full.mjs` · `shot_comment_onpage.mjs` · `shot_comments.mjs` · `shot_confirm_rows.mjs` · `shot_landing.mjs` · `shot_levels.mjs` · `shot_live.mjs` · `shot_mobile_list.mjs` · `shot_mobile_song.mjs` · `shot_mobile_top.mjs` · `shot_parts_section.mjs` · `shot_song_tables.mjs` · `shot_song_zh.mjs` · `shot_toolbar2.mjs` · `shot_toolbar_layout.mjs` · `shot_toolbar_narrow.mjs` · `shot_widget.mjs` · `upload_previews.mjs` · `upload_previews_by_name.mjs` · `upload_previews_release.mjs` · `upload_removed_previews.mjs`

### reports（70）

`analyze_xml.mjs` · `audit_actions.mjs` · `audit_conflicts.mjs` · `audit_conflicts2.mjs` · `audit_conflicts3.mjs` · `audit_conflicts4.mjs` · `audit_conflicts5.mjs` · `audit_shapes.mjs` · `audit_sources.mjs` · `census_stats.mjs` · `check_a300.cjs` · `check_circus_collab.mjs` · `check_circus_collab2.mjs` · `check_login_flow.mjs` · `check_pichineko_alias.mjs` · `check_pichineko_alias2.mjs` · `debug_alias_match.mjs` · `debug_collab_pick.mjs` · `debug_dz_chip.mjs` · `diag_giscus.mjs` · `export_cell_queues.mjs` · `export_extra_translations.mjs` · `export_zh_fix.mjs` · `export_zh_lines.mjs` · `export_zh_pending.mjs` · `export_zh_tokens.mjs` · `inspect.mjs` · `list_questionable_collab.mjs` · `list_suspicious_credits.mjs` · `list_unmatched_notes.mjs` · `make_collab_pending_docx.py` · `make_collab_questions_docx.py` · `make_conflicts_docx.py` · `make_cover.py` · `make_designer_report.py` · `make_loose_docx.py` · `make_site_notes_docx.py` · `make_todo_docx.py` · `make_unassigned_report.py` · `make_unmatched_docx.py` · `make_wiki_candidates.mjs` · `measure_mobile_row.mjs` · `measure_mobile_rows.mjs` · `measure_toolbar.mjs` · `read_green_rows.py` · `suggest_unmatched.mjs` · `survey_intro_shapes.mjs` · `survey_skipped_shapes.mjs` · `test_cn_removed.mjs` · `test_cn_removed2.mjs` · `test_collab_both_sides.mjs` · `test_collab_combo.mjs` · `test_collab_const_sort.mjs` · `test_collab_entries.mjs` · `test_collab_parts_filter.mjs` · `test_collab_toggle.mjs` · `test_const_sort.mjs` · `test_designer_badge.mjs` · `test_designer_filter.mjs` · `test_designer_level.mjs` · `test_irony.mjs` · `test_list_state_restore.mjs` · `test_star_chips.mjs` · `test_unmatched_hidden.mjs` · `test_unwelcome_collab.mjs` · `title_match.mjs` · `verify_batch_sample.mjs` · `verify_collab_decisions.mjs` · `verify_collab_live.mjs` · `verify_glossary.mjs`

### translate（5）

`glossary_fix_seed.mjs` · `rule_translate.mjs` · `translate_batch8.mjs` · `translate_pending.ps1` · `wiki_translate.mjs`

### legacy（17）

`_bili_opus_list.mjs` · `_crop_opus_imgs.py` · `_cv.mjs` · `_download_opus_imgs.mjs` · `_gen_opus_inspect.mjs` · `_lb_zoom_test.mjs` · `_logincheck.mjs` · `_opus_images.mjs` · `_opus_text_probe.mjs` · `_patch_batch2_wording.mjs` · `_patch_kyoumei.mjs` · `_patch_kyoumei_level.mjs` · `_patch_we_preview.mjs` · `_pngify_opus.py` · `_probe_unknown.mjs` · `_scan_ocr.mjs` · `_wiki_probe.mjs`

### 根目录（53）

`_add_manual_batch.mjs` · `_assign_last_loose.mjs` · `_assign_we_jokes.mjs` · `_check_unknown.mjs` · `_fix_new_song_designers.mjs` · `_merge_ichinose.mjs` · `_readd_ichinose.mjs` · `apply_collab_decisions.mjs` · `apply_manual_collab.mjs` · `apply_split_aliases.mjs` · `build_collab_exclude.mjs` · `build_collab_from_docx.mjs` · `build_collab_from_loose.mjs` · `build_collab_unique_match.mjs` · `build_decision_docx.py` · `build_designer_alias.mjs` · `build_designer_fill.mjs` · `build_designer_from_comments.mjs` · `build_designer_we.mjs` · `build_designers.mjs` · `build_designers_merged.mjs` · `build_neta_evidence.mjs` · `build_neta_review_docx.py` · `build_song_addorder.mjs` · `build_song_dates.mjs` · `build_translation_index.mjs` · `build_wiki_aliases.mjs` · `build_wiki_unknown_collab.mjs` · `chart_svg.py` · `deploy_pages.ps1` · `designer_lexicon.mjs` · `dom.mjs` · `finalize_census.mjs` · `fix_same_person_credits.mjs` · `glossary_auto_fill.mjs` · `import_new_songs.mjs` · `ocr_batch.ps1` · `ocr_win.ps1` · `overnight_full.ps1` · `parse_all_addorder.mjs` · `rebuild_collab.mjs` · `rebuild_glossary.mjs` · `render_chuni_charts.mjs` · `run_full_import.ps1` · `split_collab_credits.mjs` · `translate_batch.mjs` · `translate_batch.ps1` · `translate_lines.ps1` · `translate_merge.mjs` · `translate_when_ready.ps1` · `wiki_build.mjs` · `wiki_extra_sections.mjs` · `wiki_history_expand.mjs`
