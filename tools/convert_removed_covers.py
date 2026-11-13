# 把本地游戏数据的封面 DDS 转成 webp，生成 source/_data/chuni_removed_songs.json
import json, os, hashlib
from PIL import Image

SRC = r"D:\Deepseek work\blog\_tmp\build\chuni_removed_songs.json"
GAME = r"D:\XVX\HDD\bin\option\A300\music"
OUT_DIR = r"D:\Deepseek work\blog\source\assets\img\chuni-removed"
OUT = r"D:\Deepseek work\blog\source\_data\chuni_removed_songs.json"

items = json.load(open(SRC, encoding="utf-8"))
os.makedirs(OUT_DIR, exist_ok=True)

converted = 0
missing = []
for it in items:
    cg = it.get("coverGame") or ""
    cover_url = ""
    if cg:
        src_path = os.path.join(GAME, cg.replace("/", os.sep))
        if os.path.exists(src_path):
            h = hashlib.md5(it["title"].encode("utf-8")).hexdigest()[:10]
            dst = os.path.join(OUT_DIR, h + ".webp")
            if not os.path.exists(dst):
                try:
                    im = Image.open(src_path).convert("RGB")
                    im.save(dst, "WEBP", quality=88)
                    converted += 1
                except Exception as e:
                    missing.append((it["title"], str(e)))
            cover_url = "/assets/img/chuni-removed/" + h + ".webp"
        else:
            missing.append((it["title"], "file not found"))
    it["cover"] = cover_url

    sheets = []
    for sh in it.get("sheets", []):
        lv = str(sh.get("level") or "")
        iv = sh.get("internalValue")
        sheets.append({
            "type": "std",
            "difficulty": sh["difficulty"],
            "level": lv,
            "internal": ("%.1f" % iv) if isinstance(iv, (int, float)) else "",
            "internalValue": iv,
            "designer": sh.get("designer") or "",
            "notes": {"tap": None, "hold": None, "slide": None, "air": None, "flick": None, "total": None},
            "regions": {"jp": True, "intl": True},
            "special": False,
        })
    it["sheets"] = sheets
    it["release"] = it.get("release") or ""
    it["bpm"] = int(it["bpm"]) if str(it.get("bpm") or "").isdigit() else (it.get("bpm") or 0)
    it.pop("coverGame", None)
    it.pop("genre", None)
    it.pop("removedAt", None)

json.dump(items, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("items", len(items), "converted", converted, "with cover", sum(1 for x in items if x["cover"]), "issues", len(missing))
for m in missing[:5]:
    print("  ", m)
