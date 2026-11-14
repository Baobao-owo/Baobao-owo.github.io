# 生成「谱师留言·未匹配清单」docx
import json
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROWS = json.load(open(r"D:\Deepseek work\blog\_tmp\build\unmatched-notes.json", encoding="utf-8"))
OUT = r"D:\Deepseek work\blog\_tmp\谱师留言-未匹配清单.docx"

songs = [r for r in ROWS if "歌曲" in r["kind"]]
others = [r for r in ROWS if "歌曲" not in r["kind"]]

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(9)

h = doc.add_heading("谱师留言 · 未匹配清单", level=1)
p = doc.add_paragraph()
p.add_run(
    "共 %d 条没对上站内曲目。其中 %d 条像「歌名对不上」，%d 条像「小节标题/非曲目」。\n"
    "数据源：note-report.pages.dev（Sapphire 的资源站 · 谱面部会报）。下面的「原文首句」只截了第一句，"
    "完整内容点链接看原页面。" % (len(ROWS), len(songs), len(others))
).font.size = Pt(9)

doc.add_heading("一、疑似歌曲（站内没有，或名字写法不同）", level=2)
doc.add_paragraph("这 %d 条最值得看：可能是我漏收的曲、改名曲，或者会报里的写法跟站内不一样。" % len(songs))

t1 = doc.add_table(rows=1, cols=6)
t1.style = "Light Grid Accent 1"
hdr = t1.rows[0].cells
for i, name in enumerate(["期数", "谱师", "难度", "会报里的标题", "原文首句", "来源"]):
    hdr[i].text = name
    for run in hdr[i].paragraphs[0].runs:
        run.font.bold = True
        run.font.size = Pt(8)

for r in songs:
    cells = t1.add_row().cells
    vals = [r["round"], r["designer"], r["diff"], r["title"], r["jp"] or r["zh"], r["src"]]
    for i, v in enumerate(vals):
        cells[i].text = str(v)
        for par in cells[i].paragraphs:
            for run in par.runs:
                run.font.size = Pt(8)

doc.add_heading("二、疑似小节标题 / 非曲目（可以不管）", level=2)
doc.add_paragraph("这 %d 条多是「前言」「结尾」「关于 ADVANCED」这类段落标题，不是曲评。" % len(others))

t2 = doc.add_table(rows=1, cols=3)
t2.style = "Light List Accent 1"
hdr = t2.rows[0].cells
for i, name in enumerate(["期数", "标题", "谱师"]):
    hdr[i].text = name
    for run in hdr[i].paragraphs[0].runs:
        run.font.bold = True
        run.font.size = Pt(8)

for r in others:
    cells = t2.add_row().cells
    for i, v in enumerate([r["round"], r["title"], r["designer"]]):
        cells[i].text = str(v)
        for par in cells[i].paragraphs:
            for run in par.runs:
                run.font.size = Pt(8)

doc.save(OUT)
print("saved", OUT, len(songs), "songs /", len(others), "others")
