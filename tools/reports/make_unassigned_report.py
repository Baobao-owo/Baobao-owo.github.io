# -*- coding: utf-8 -*-
"""导出所有「无归属」谱面（who 为空）的完整清单，带类型标注"""
import json, os, datetime
from docx import Document
from docx.shared import Pt

BASE = r"D:\Deepseek work\blog"
D = json.load(open(os.path.join(BASE, "source/assets/data/designers.json"), encoding="utf-8"))
DIFF = {"b": "BASIC", "a": "ADVANCED", "e": "EXPERT", "m": "MASTER", "u": "ULTIMA"}

# 用曲库里的正式曲名替换 designers.json 的规范化键
site = json.load(open(os.path.join(BASE, "source/_data/chuni.json"), encoding="utf-8"))["songs"]
removed = json.load(open(os.path.join(BASE, "source/_data/chuni_removed_songs.json"), encoding="utf-8"))

def norm(s):
    import unicodedata
    s = unicodedata.normalize("NFKC", str(s or "")).lower()
    return "".join(ch for ch in s if not ch.isspace())

title_of = {}
for s in site + removed:
    title_of.setdefault(norm(s["title"]), s["title"])

COMBO = (" vs ", " VS ", "supported by", "&", "×", "＋", " + ", "fused with", "cooperated", "meets", "feat")
TEAM = ("譜面ボーイズ", "譜百ボーイズ", "Fumen Unit", "Fumen Team", "楽団", "コラボユニット", "怪盗団", "組長", "教団", "SEGA")

def kind(raw):
    if any(k in raw for k in COMBO):
        return "双人/合作写法"
    if any(k in raw for k in TEAM):
        return "团队名义"
    return "其他"

rows = []
for key, rec in D.get("songs", {}).items():
    for k in ("b", "a", "e", "m", "u"):
        x = rec.get(k)
        if x and not x.get("who"):
            raw = x.get("raw", "")
            rows.append((title_of.get(norm(key), key), DIFF[k], raw, kind(raw)))

order = {"双人/合作写法": 0, "团队名义": 1, "其他": 2}
rows.sort(key=lambda r: (order.get(r[3], 9), r[0].lower(), r[1]))

doc = Document()
doc.styles["Normal"].font.name = "Microsoft YaHei"
doc.styles["Normal"].font.size = Pt(10)
doc.add_heading("谱师分类：无归属谱面清单", level=0)
p = doc.add_paragraph()
counts = {}
for r in rows:
    counts[r[3]] = counts.get(r[3], 0) + 1
summary = "　".join(f"{k} {v} 张" for k, v in counts.items())
p.add_run(f"共 {len(rows)} 张　｜　{summary}　｜　生成于 {datetime.datetime.now():%Y-%m-%d %H:%M}").font.size = Pt(9)

doc.add_paragraph("说明：这些谱面的署名是团队名或双人组合写法，无法落到单个谱师，属于「合作谱」，不是数据缺失。")

t = doc.add_table(rows=1, cols=5)
t.style = "Light Grid Accent 1"
for i, h in enumerate(["#", "曲名", "难度", "原始署名", "类型"]):
    t.rows[0].cells[i].text = h
for i, (title, diff, raw, k) in enumerate(rows, 1):
    c = t.add_row().cells
    c[0].text = str(i)
    c[1].text = title
    c[2].text = diff
    c[3].text = raw or "（空）"
    c[4].text = k

out = os.path.join(BASE, "_tmp", "谱师分类-无归属谱面.docx")
doc.save(out)
print(out, len(rows), counts)
