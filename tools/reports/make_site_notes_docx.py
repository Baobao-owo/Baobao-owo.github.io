# -*- coding: utf-8 -*-
"""把 docs/chuni-site-notes.md 转成 Word，便于阅读"""
import re, os
from docx import Document
from docx.shared import Pt

BASE = r"D:\Deepseek work\blog"
SRC = os.path.join(BASE, "docs", "chuni-site-notes.md")
OUT = os.path.join(BASE, "_tmp", "中二节奏曲库站维护说明.docx")

doc = Document()
doc.styles["Normal"].font.name = "Microsoft YaHei"
doc.styles["Normal"].font.size = Pt(10.5)

lines = open(SRC, encoding="utf-8").read().splitlines()
i = 0
table_buf = []

def flush_table():
    global table_buf
    if not table_buf:
        return
    rows = [r for r in table_buf if not re.match(r"^\|[\s\-:|]+\|$", r)]
    cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
    if cells:
        t = doc.add_table(rows=0, cols=len(cells[0]))
        t.style = "Light Grid Accent 1"
        for r in cells:
            row = t.add_row().cells
            for idx, val in enumerate(r[:len(row)]):
                row[idx].text = val
    table_buf = []

for line in lines:
    s = line.rstrip()
    if s.startswith("|"):
        table_buf.append(s)
        continue
    flush_table()

    if not s.strip():
        continue
    if s.startswith("#"):
        level = len(s) - len(s.lstrip("#"))
        doc.add_heading(s.lstrip("#").strip(), level=min(level, 4))
    elif s.startswith(">"):
        p = doc.add_paragraph(s.lstrip("> ").strip())
        p.runs[0].italic = True
    elif re.match(r"^\d+\.\s", s):
        doc.add_paragraph(re.sub(r"^\d+\.\s", "", s), style="List Number")
    elif s.startswith("- "):
        doc.add_paragraph(s[2:], style="List Bullet")
    else:
        doc.add_paragraph(s)

flush_table()
doc.save(OUT)
print(OUT)
