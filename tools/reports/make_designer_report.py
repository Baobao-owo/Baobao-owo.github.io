# -*- coding: utf-8 -*-
"""整理谱师分类数据，导出 docx 清单"""
import json, os, datetime
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

BASE = r"D:\Deepseek work\blog"
D = json.load(open(os.path.join(BASE, "source/assets/data/designers.json"), encoding="utf-8"))
A = json.load(open(os.path.join(BASE, "source/_data/chuni_designer_alias.json"), encoding="utf-8"))

designers = sorted(D["designers"], key=lambda x: -x.get("charts", 0))
loose = D.get("loose", [])
stats = D.get("stats", {})

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(10.5)

title = doc.add_heading("谱师分类数据整理", level=0)

p = doc.add_paragraph()
p.add_run(f"生成时间：{datetime.datetime.now():%Y-%m-%d %H:%M}　｜　数据源：designers.json / chuni_designer_alias.json").font.size = Pt(9)

doc.add_heading("一、总览", level=1)
rows = [
    ("谱师数量", f"{len(designers)} 位"),
    ("登记曲目", f"{len(D.get('songs', {}))} 首"),
    ("谱面条目", f"{sum(len([k for k in ('b','a','e','m','u') if s.get(k)]) for s in D.get('songs', {}).values()):,} 张"),
    ("署名别名", f"{len(A):,} 条"),
    ("其他（团队）名义", f"{len(loose)} 个"),
]
t = doc.add_table(rows=0, cols=2)
t.style = "Light Grid Accent 1"
for k, v in rows:
    c = t.add_row().cells
    c[0].text = k
    c[1].text = v

doc.add_heading("二、谱师一览（按谱面数排序）", level=1)
t = doc.add_table(rows=1, cols=4)
t.style = "Light Grid Accent 1"
h = t.rows[0].cells
for i, name in enumerate(["谱师", "谱面数", "曲目数", "别名数"]):
    h[i].text = name
for d in designers:
    c = t.add_row().cells
    c[0].text = d["name"]
    c[1].text = str(d.get("charts", ""))
    c[2].text = str(d.get("songs", ""))
    c[3].text = str(d.get("aliases", ""))

doc.add_heading("三、其他（团队）名义", level=1)
t = doc.add_table(rows=1, cols=2)
t.style = "Light Grid Accent 1"
h = t.rows[0].cells
h[0].text = "名义"
h[1].text = "曲数"
for d in sorted(loose, key=lambda x: -x.get("songs", 0)):
    c = t.add_row().cells
    c[0].text = d["name"]
    c[1].text = str(d.get("songs", 0))

doc.add_heading("四、数据检查", level=1)
no_who = 0
miss = []
for title, rec in D.get("songs", {}).items():
    for k in ("b", "a", "e", "m", "u"):
        x = rec.get(k)
        if x and not x.get("who"):
            no_who += 1
            if len(miss) < 40:
                miss.append(f"{title}（{k.upper()}）— {x.get('raw','')}")
combo = sum(1 for v in A.values() if "×" in v)
checks = [
    f"谱面缺少归属（who 为空）：{no_who} 张",
    f"组合型别名（A × B）：{combo} 条",
    "自指别名：已清理 1 条",
]
for c in checks:
    doc.add_paragraph(c, style="List Bullet")

if miss:
    doc.add_heading("五、待补归属的谱面（前 40 条）", level=1)
    for m in miss:
        doc.add_paragraph(m, style="List Number")

out = os.path.join(BASE, "_tmp", "谱师分类整理.docx")
doc.save(out)
print(out)
