# 生成「其他名义待指派」docx
import json
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn

SRC = "_tmp/loose-for-docx.json"
OUT = "谱师-其他名义待指派清单.docx"

data = json.load(open(SRC, encoding="utf-8"))
rows = data["rows"]
people = [p for p in data["people"] if not p["pseudo"]]
pseudo = [p for p in data["people"] if p["pseudo"]]

doc = Document()

# 全局字体
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(9)
style.element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")

# 正文宽度
sec = doc.sections[0]
sec.left_margin = Cm(1.8)
sec.right_margin = Cm(1.8)
sec.top_margin = Cm(1.6)
sec.bottom_margin = Cm(1.6)
usable = sec.page_width - sec.left_margin - sec.right_margin


def h(text, level=1):
    p = doc.add_heading(text, level=level)
    for r in p.runs:
        r.font.name = "Microsoft YaHei"
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    return p


def para(text, size=9, bold=False, color=None):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.bold = bold
    r.font.name = "Microsoft YaHei"
    r._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")
    if color:
        r.font.color.rgb = color
    return p


h("其他名义 · 待指派清单", 0)
para("曲目导览 › 谱师筛选 › 其他名义（共 %d 条）" % len(rows), 9, color=RGBColor(0x66, 0x66, 0x66))
para("")
para("怎么用：看「名义」这一列，如果知道它是谁的别名，就在「你判断是」那一列写上谱师名字（或下表的编号）。"
     "不确定的可以空着；确认是团队/团体名的写「团队」，确认查不到人的写「不明」。", 9)
para("")

h("可填的谱师（47 人）", 1)
para("写名字或编号都行，例如「じゃこレモン」或「3」。", 8, color=RGBColor(0x66, 0x66, 0x66))

cols = 4
per = (len(people) + cols - 1) // cols
grid = doc.add_table(rows=per, cols=cols * 2)
grid.style = "Table Grid"
for i, p in enumerate(people):
    r = i % per
    c = (i // per) * 2
    cell = grid.cell(r, c)
    cell.text = "%d. %s" % (i + 1, p["name"])
    cell2 = grid.cell(r, c + 1)
    cell2.text = "%d 首" % p["songs"]
    for cc in (cell, cell2):
        for pp in cc.paragraphs:
            for rr in pp.runs:
                rr.font.size = Pt(8)
                rr.font.name = "Microsoft YaHei"
                rr._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")

para("")
para("另外两个分类：%s" % " · ".join("%s（%d 首）" % (p["name"], p["songs"]) for p in pseudo), 9)

doc.add_page_break()
h("待指派的名义", 1)
para("「曲数」＝ 这个名义在站内出现多少次；「出现在」＝ 能定位到的曲目（有些名义只在历史数据里出现，站内没有对应曲目，留空）。",
     8, color=RGBColor(0x66, 0x66, 0x66))
para("")

widths = [Cm(1.1), Cm(7.4), Cm(1.3), Cm(7.0), Cm(3.6)]
headers = ["#", "名义", "曲数", "出现在", "你判断是"]
table = doc.add_table(rows=1, cols=len(headers))
table.style = "Table Grid"
table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = table.rows[0].cells
for i, name in enumerate(headers):
    hdr[i].text = name
    for pp in hdr[i].paragraphs:
        for rr in pp.runs:
            rr.bold = True
            rr.font.size = Pt(8.5)
            rr.font.name = "Microsoft YaHei"
            rr._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")

for row in rows:
    cells = table.add_row().cells
    values = [
        str(row["n"]),
        row["name"],
        str(row["count"]) if row["count"] else "",
        "、".join(row["songs"]) if row["songs"] else "",
        "",
    ]
    for i, v in enumerate(values):
        cells[i].text = v
        for pp in cells[i].paragraphs:
            for rr in pp.runs:
                rr.font.size = Pt(8)
                rr.font.name = "Microsoft YaHei"
                rr._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft YaHei")

for i, w in enumerate(widths):
    for row in table.rows:
        row.cells[i].width = w

doc.save(OUT)
print("saved", OUT, "rows", len(rows))
