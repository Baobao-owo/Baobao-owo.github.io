# -*- coding: utf-8 -*-
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

FONT = "微软雅黑"

def set_run(run, size=10.5, bold=False, color=None):
    run.font.name = FONT
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color
    run._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

def para(doc, text="", size=10.5, bold=False, color=None, space_after=4, indent=0):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(0)
    if indent:
        p.paragraph_format.left_indent = Pt(indent)
    r = p.add_run(text)
    set_run(r, size, bold, color)
    return p

items = [
    ("1. id 其实是曲名，不是 musicId",
     "chuni.json 里 songs[].id 存的是曲名，比如 B.B.K.K.B.K.K.；真正的游戏 musicId 只在 chuni_ids.json（1990 条）。",
     "有 19 首查不到 musicId；任何要拼 musicId_难度 的对照（c2s、预览图、落雪）都得先查表，直接拿 id 当 musicId 会全错。",
     ["A. 保持现状，所有脚本强制先查 chuni_ids.json",
      "B. 给 songs 每条加 musicId 字段（id 仍存曲名）",
      "C. 把 id 改成 musicId，曲名另存一个字段"]),

    ("2. 曲名重复 146 组",
     "2011 条记录只有 1855 个不同曲名。",
     "普通谱和 WORLD'S END 变体共用曲名，例：B.B.K.K.B.K.K. 与 (WE) B.B.K.K.B.K.K. 的 title 完全一样。谱师、介绍、留言、别名、倒排表都按曲名索引，同名两首会互相覆盖。",
     ["A. 把 WE 变体的 title 改成 (WE) 曲名，让曲名唯一",
      "B. 所有映射改成「曲名 + 版本」复合键",
      "C. 维持现状，WE 数据只走 chuni_we 那套文件"]),

    ("3. 谱师：c2s 原文 vs 站内显示，1231 处不同",
     "能对照的 7185 张谱里，1231 张的 c2s CREATOR 与站内显示不一致。",
     "多数是别名归一（Cyberocher → ロシェ＠ペンギン、Unlimited Lemon! → じゃこレモン）；但有几处是真名不同：タイガーランペイジ ULTIMA 原文 Panther Rampage、站内 ぴちネコ；Lapis ULTIMA 原文 Piercing Blade、站内 アミノハバキリ；六兆年と一夜物語 ULTIMA 原文 ペンギンは人になりたかった、站内 ロシェ＠ペンギン。这与「显示游戏原文」的原则冲突。",
     ["A. 全部显示 c2s 原文（含称号/梗名）",
      "B. 保留归一显示，只有 ULTIMA 显示原文",
      "C. 维持归一，但把 1231 条差异人工过一遍，只改真名不同的"]),

    ("4. 定数：站内 vs 落雪，35 处不一致",
     "5540 张一致，35 张不一致。",
     "例：Äventyr MASTER 13.8 vs 14；緋色のDance MASTER 12.6 vs 13；FLOWER ADVANCED 6 vs 5；Xevel ADVANCED 8 vs 8.5；Pump!n ADVANCED 6 vs 7；PRIVATE SERVICE ULTIMA 14.9 vs 15。",
     ["A. 以站内为准",
      "B. 以落雪为准，逐条核对后改站内",
      "C. 以 Mate 的 Music.xml 重新扫一遍（最准，但要重扫）"]),

    ("5. 删除曲数量三个口径",
     "站内 chuni_removed_songs.json 140 首；Mate A300 目录 530 个；页面合计 2151 = 2011 + 140。",
     "A300 比站内多 390 首。不清楚是站内只收了有 wiki 介绍和封面的，还是真漏了。",
     ["A. 补齐 A300 全部（需要补 wiki 介绍和封面）",
      "B. 只收有资料的，维持 140",
      "C. 先把差集列出来，看过再决定"]),

    ("6. 版本字段 192 首是 null",
     "另有 VERSE 与 X-VERSE、CHUNITHM NEW 与 X-VERSE-X 混用。",
     "VERSION_LABEL_FIX 只在生成端改显示，数据本身没统一。",
     ["A. 用 Mate 的 Music.xml 回填",
      "B. 从 wiki / arcade-songs 补",
      "C. 保持 null，页面显示「未知版本」"]),

    ("7. 介绍缺 15 首",
     "chuni_extra.json 2145 条，曲库 2151 首，15 首查不到条目。",
     "缺的有 ODDS&ENDS、トリスメギストス、-OutsideR:RequieM-、Title、GEMINI -M- 等；另有 2 条缺日文原文、2 条缺中文。",
     ["A. 补抓 wiki 日文原文并翻译",
      "B. 先留空，不显示「介绍」区",
      "C. 你手写或指定来源"]),

    ("8. 预览图缺 88 张",
     "按 musicId_难度 计，应该有 7495 张，现在缺 88。",
     "缺的多半是新曲或 WE 谱。",
     ["A. 用 Marisa 补渲染并上传",
      "B. 暂时跳过"]),

    ("9. 谱师留言 477 条，只对上 466 首",
     "11 条按曲名找不到歌。",
     "之前统计的「537 首有留言」是重复标题被重复算了。",
     ["A. 把 11 条对不上的列出来人工核对曲名",
      "B. 不管"]),

    ("10. 合作判定四套并存",
     "collab.json 148 首、docx 白名单 166 首、分工表 28 首、别名表里 51 条 A × B（45 条用于显示）。",
     "同一首可能出现「docx 说是合作、collab.json 里没参与者」的情况。",
     ["A. 以 docx 白名单为准（166）",
      "B. 以 collab.json 参与者为准（148）",
      "C. 两套合并取并集，并标注来源"]),

    ("11. 分工表存了两份",
     "source/_data/collab_parts.json 与 source/assets/data/collab-parts.json 内容相同。",
     "构建读的是 _data 那份，但两份分开维护，之前出过「一份 5 条、一份 17 条」的事故。",
     ["A. 只留 _data 一份，删掉 assets 那份并改构建",
      "B. 保留两份，加一个同步脚本",
      "C. 反过来以 assets 为准"]),

    ("12. 总数口径混用",
     "2011（本体）、2151（含删除曲）、1855（唯一曲名）三个数在不同文档和脚本里都出现过。",
     "写的时候没标清是哪个口径。",
     ["A. 文档统一写「本体 2011 / 含删除曲 2151」，需要唯一曲名时单列",
      "B. 其他写法"]),

    ("13. 翻译两套文件",
     "batch1–78-raw/translated.json 与 zh-*.jsonl 各自成体系，没有总索引。",
     "看不出哪批最后合进了 chuni_extra.json。",
     ["A. 合并成一份索引导航",
      "B. 只保留 zh-*.jsonl，删掉旧批次",
      "C. 不管，只记录现状"]),

    ("14. chunithm-data.json 其实没法拿来对定数",
     "它的 sheets 结构和站内不同（type 数字/字符串混用），本次审计比对 0 条。",
     "它不是可用的定数校对源。",
     ["A. 从「可用数据源」里划掉",
      "B. 修结构后继续用"]),
]

doc = Document()
# 页边距收一点
for section in doc.sections:
    section.top_margin = section.bottom_margin = Pt(50)
    section.left_margin = section.right_margin = Pt(56)

para(doc, "中二节奏曲库站 · 数据对撞清单", size=20, bold=True, space_after=6)
para(doc, "2026-11-15 · 共 14 条，待你逐条裁定", size=10, color=RGBColor(0x88, 0x88, 0x88), space_after=12)

para(doc, "怎么改", size=12, bold=True, space_after=4)
para(doc, "每条下面有一行「你的判断」，直接在那里写就行：", size=10.5, space_after=2)
para(doc, "・觉得哪条对，就写「按 A」/「按 B」/「按 C」；", size=10.5, space_after=2)
para(doc, "・整条不对，就写「删掉」或者直接划掉；", size=10.5, space_after=2)
para(doc, "・结论不是我给的几个选项，就直接写你的说法。", size=10.5, space_after=2)
para(doc, "不确定的可以写「先放着」，我就先不动它。", size=10.5, space_after=14)

for title, phen, evid, opts in items:
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(title)
    set_run(r, 13, bold=True, color=RGBColor(0x1f, 0x4e, 0x79))

    para(doc, "现象：" + phen, size=10.5, space_after=2)
    para(doc, "证据：" + evid, size=10.5, space_after=2, color=RGBColor(0x55, 0x55, 0x55))
    para(doc, "可选处理：", size=10.5, space_after=1)
    for o in opts:
        para(doc, "    " + o, size=10.5, space_after=1)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("你的判断：")
    set_run(r, 10.5, bold=True, color=RGBColor(0xb0, 0x50, 0x20))
    r2 = p.add_run("________________________________________________")
    set_run(r2, 10.5, color=RGBColor(0xbb, 0xbb, 0xbb))

out = r"D:\Deepseek work\blog\_tmp\数据对撞清单.docx"
doc.save(out)
print("saved", out)
