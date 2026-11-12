"""把每帖最后 1-2 张图裁出底部区域（删除名单一般在最末尾），存成 PNG 供 OCR。"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, '_tmp', 'opus-imgs')
OUT_DIR = os.path.join(ROOT, '_tmp', 'opus-crops')
os.makedirs(OUT_DIR, exist_ok=True)

downloaded = json.load(open(os.path.join(ROOT, '_tmp', 'opus-downloaded.json'), encoding='utf-8'))
made = []
for pid, files in downloaded.items():
    for f in files[-2:]:
        try:
            im = Image.open(f)
        except Exception:
            continue
        im = im.convert('RGB')
        w, h = im.size
        if h > w * 2:
            # 长图：取底部 2000px
            crop = im.crop((0, max(0, h - 2000), w, h))
        else:
            crop = im
        out = os.path.join(OUT_DIR, os.path.basename(f).rsplit('.', 1)[0] + '.png')
        crop.save(out)
        made.append(out)
print('\n'.join(made))
