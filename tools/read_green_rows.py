# 读取 docx 里被标绿的行（高亮 BRIGHT_GREEN / 绿色），输出为 JSON
import json
from docx import Document
from docx.enum.text import WD_COLOR_INDEX

SRC = r"D:\Deepseek work\blog\_tmp\谱师留言-未匹配清单-2.docx"
OUT = r"D:\Deepseek work\blog\_tmp\build\green-rows.json"

doc = Document(SRC)

GREEN_NAMES = {"BRIGHT_GREEN", "GREEN"}

def run_is_green(run):
    hl = run.font.highlight_color
    if hl is None:
        return False
    return getattr(hl, "name", str(hl)).upper() in GREEN_NAMES

def cell_green(cell):
    for p in cell.paragraphs:
        for r in p.runs:
            if run_is_green(r):
                return True
    # 有的绿色是单元格底纹，这里也查一下
    try:
        tcPr = cell._tc.tcPr
        if tcPr is not None and tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd') is not None:
            fill = tcPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd').get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill')
            if fill and fill.upper() in ('00FF00', '92D050', 'C6EFCE'):
                return True
    except Exception:
        pass
    return False

rows = []
for ti, table in enumerate(doc.tables):
    for row in table.rows[1:]:
        cells = row.cells
        if any(cell_green(c) for c in cells):
            rows.append({
                "table": ti,
                "cells": [c.text.strip() for c in cells],
            })

json.dump(rows, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("绿色行:", len(rows))
for r in rows[:15]:
    print("  ", " ‖ ".join(r["cells"])[:160])
