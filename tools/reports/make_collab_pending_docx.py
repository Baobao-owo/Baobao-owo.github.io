# 把待确认的合作条目整理成 docx 表格，方便人工逐条确认
import json, io, re, unicodedata, datetime
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

PENDING = r"D:\Deepseek work\blog\_tmp\collab-pending.json"
OUT = r"D:\Deepseek work\blog\谱师合作-待确认清单.docx"

def norm(s):
    s = unicodedata.normalize("NFKC", str(s or ""))
    s = re.sub(r"\s*[-\u2010\u2011\u2012\u2013\u2014\u2015\uFF0D]\s*", "-", s)
    return re.sub(r"\s+", " ", s).strip().lower()

items = json.load(io.open(PENDING, encoding="utf-8"))
seen = set()
rows = []
for it in items:
    key = (norm(it["title"]), norm(it["credit"]))
    if key in seen:
        continue
    seen.add(key)
    rows.append(it)

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(10)
style._element.rPr.rFonts.set(
    "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}eastAsia", "Microsoft YaHei"
)

h = doc.add_heading("谱师合作 · 待确认清单", level=0)
p = doc.add_paragraph(
    "这些条目在 docx 里没写难度、或者曲名和站内数据对不上，我没敢猜。"
    "请在最右一列写上：E（红谱）/ M（黑谱）/ U（紫谱）/ X（不算合作），多个用逗号，比如「M」「E,M」。"
)
p.runs[0].font.size = Pt(9)

p2 = doc.add_paragraph("生成时间：%s · 共 %d 条" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), len(rows)))
p2.runs[0].font.size = Pt(9)

table = doc.add_table(rows=1, cols=5)
table.style = "Light Grid Accent 1"
hdr = table.rows[0].cells
for i, name in enumerate(["#", "曲名", "署名", "我卡在哪", "你来定"]):
    hdr[i].text = name

for i, it in enumerate(rows, 1):
    cells = table.add_row().cells
    cells[0].text = str(i)
    cells[1].text = it["title"]
    cells[2].text = it["credit"]
    cells[3].text = it["reason"]
    cells[4].text = ""

widths = [Cm(1.0), Cm(5.2), Cm(6.4), Cm(3.2), Cm(2.2)]
for row in table.rows:
    for idx, w in enumerate(widths):
        row.cells[idx].width = w

doc.add_paragraph("")
tail = doc.add_paragraph(
    "备注：标了「难度不确定」的，是因为谱面 charter 字段和署名对不上（多半是署名用了完全不同的名义）；"
    "标了「曲名对不上」的，是 docx 里的写法（比如带 [改]、去掉空格、日文括号差异）在站内找不到同名曲。"
)
tail.runs[0].font.size = Pt(9)

doc.save(OUT)
print("saved", OUT, len(rows), "rows")
