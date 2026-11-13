# 从「谱师学ep0.5 - 谱面列表.docx」生成合作谱数据
#   产物：source/assets/data/collab.json（songs: 曲名 -> {e:[人],m:[人],u:[人]}）
#         _tmp/collab-pending.json（待人工确认的条目）
#   规则：
#     · 只有「至少两个真人」才算合作谱；单人条目直接跳过
#     · 难度：红=EXPERT；黑/紫=MASTER；没标的按 charter 反查，反查不出来挂 pending
#     · 纯拉丁别名要求词边界，避免「R-BLACKJACK」里认出「Jack」
import json
import re
import io
import unicodedata
from docx import Document

DOCX = r"D:\QQ\Downloads\谱师学ep0.5 - 谱面列表.docx"
SRC = r"D:\QQ\Downloads\songs.min.json"
SITE = r"D:\Deepseek work\blog\public\chuni-songs.json"
DESIGNERS = r"D:\Deepseek work\blog\source\assets\data\designers.json"
OUT = r"D:\Deepseek work\blog\source\assets\data\collab.json"
PENDING = r"D:\Deepseek work\blog\_tmp\collab-pending.json"

# 用户已经确认过的个案：Jack the GAME 是 ぴちネコ 单人，不算合作
SOLO_OVERRIDE = {"jack the game"}

DASH_RE = re.compile(r"\s*[-\u2010\u2011\u2012\u2013\u2014\u2015\uFF0D]\s*")


def norm(s):
    s = unicodedata.normalize("NFKC", str(s or ""))
    s = DASH_RE.sub("-", s)
    return re.sub(r"\s+", " ", s).strip().lower()


src = json.load(io.open(SRC, encoding="utf-8"))
designers = json.load(io.open(DESIGNERS, encoding="utf-8"))
site = json.load(io.open(SITE, encoding="utf-8"))

site_titles = {norm(r["t"]): r["t"] for r in site}

alias2who = {}
for d in src["designers"]:
    alias2who[norm(d["name"])] = d["name"]
    for a in d.get("aliases", []):
        alias2who[norm(a)] = d["name"]

keep = {d["name"] for d in designers["designers"]}
ASCII_RE = re.compile(r"[\x00-\x7f]+$")


def people_in(text):
    t = norm(text)
    found = []
    for alias, who in sorted(alias2who.items(), key=lambda x: -len(x[0])):
        if len(alias) < 3 or who not in keep:
            continue
        if ASCII_RE.fullmatch(alias):
            if not re.search(r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])", t):
                continue
        elif alias not in t:
            continue
        if who not in found:
            found.append(who)
    return found


charts_by_title = {norm(s["title"]): s.get("charts", []) for s in src["songs"]}

doc = Document(DOCX)
cur = None
rows = []
for p in doc.paragraphs:
    t = p.text.strip()
    if not t:
        continue
    if p.style.name.startswith("Heading"):
        cur = t
        continue
    if p.style.name == "Title":
        continue
    if cur is not None:
        rows.append((cur, t))

suffix_re = re.compile(r"(红|黑|紫)\s*$")
explicit_map = {"红": "e", "黑": "m", "紫": "m"}

collab = {}
pending = []
stats = {"rows": len(rows), "explicit": 0, "inferred": 0, "noDiff": 0, "noTitle": 0, "collabEntries": 0,
         "soloSkipped": 0, "overrideSolo": 0}


def split_line(line):
    """把「曲名 - 署名」拆开，用站内曲名反验证，避开曲名里自带的破折号"""
    best = None
    for m in DASH_RE.finditer(line):
        left = line[: m.start()].strip()
        right = line[m.end():].strip()
        if not left or not right:
            continue
        cand = norm(re.sub(r"(红|黑|紫)$", "", left).strip())
        if cand in site_titles or cand in charts_by_title:
            if best is None or len(cand) > len(best[0]):
                best = (cand, left, right)
    if best:
        return best[1], best[2]
    if " - " in line:
        a, b = line.split(" - ", 1)
        return a.strip(), b.strip()
    return line.strip(), ""


for heading, line in rows:
    title_raw, credit = split_line(line)
    title_raw = title_raw.strip()
    m = suffix_re.search(title_raw)
    explicit = explicit_map.get(m.group(1)) if m else None
    if m:
        title_raw = title_raw[: m.start()].strip()
    key = norm(title_raw)

    if key in SOLO_OVERRIDE:
        stats["overrideSolo"] += 1
        continue

    if key not in charts_by_title and key not in site_titles:
        stats["noTitle"] += 1
        pending.append({"reason": "曲名对不上", "heading": heading, "title": title_raw, "credit": credit})
        continue

    people = people_in(credit) or people_in(heading)
    people = [p for i, p in enumerate(people) if p not in people[:i]]
    if len(people) < 2:
        stats["soloSkipped"] += 1
        continue

    diffs = []
    if explicit:
        diffs = [explicit]
        stats["explicit"] += 1
    else:
        c = norm(credit)
        hits = []
        for ch in charts_by_title.get(key, []):
            d = {"EXPERT": "e", "MASTER": "m", "ULTIMA": "u"}.get(ch.get("difficulty"))
            if not d:
                continue
            charter = norm(ch.get("charter", ""))
            if not charter:
                continue
            if charter in c or c in charter:
                hits.append(d)
                continue
            who = alias2who.get(charter)
            if who and who in people:
                hits.append(d)
        diffs = [d for i, d in enumerate(hits) if d not in hits[:i]]
        if len(diffs) == 1:
            stats["inferred"] += 1

    if not diffs:
        stats["noDiff"] += 1
        pending.append({"reason": "难度不确定", "heading": heading, "title": title_raw, "credit": credit})
        continue

    entry = collab.setdefault(key, {})
    for d in diffs:
        bucket = entry.setdefault(d, [])
        for p in people:
            if p not in bucket:
                bucket.append(p)
    stats["collabEntries"] += 1

for key in list(collab.keys()):
    entry = {d: who for d, who in collab[key].items() if len(who) >= 2}
    if entry:
        collab[key] = entry
    else:
        del collab[key]

payload = {
    "stats": dict(stats, songs=len(collab), pending=len(pending)),
    "songs": collab,
}
io.open(OUT, "w", encoding="utf-8").write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
io.open(PENDING, "w", encoding="utf-8").write(json.dumps(pending, ensure_ascii=False, indent=1))
print("ok", json.dumps(payload["stats"], ensure_ascii=False))
