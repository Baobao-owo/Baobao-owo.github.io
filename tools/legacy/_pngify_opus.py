"""把 _tmp/opus-imgs 下的 avif/webp 都转成 png，供 Windows OCR 使用。"""
import json
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, '_tmp', 'opus-imgs')
OUT = os.path.join(ROOT, '_tmp', 'opus-png')
os.makedirs(OUT, exist_ok=True)

made = 0
for f in os.listdir(SRC):
    if not f.lower().endswith(('.avif', '.webp', '.jpg', '.jpeg', '.png')):
        continue
    dst = os.path.join(OUT, f.rsplit('.', 1)[0] + '.png')
    if os.path.exists(dst):
        made += 1
        continue
    try:
        im = Image.open(os.path.join(SRC, f)).convert('RGB')
        im.save(dst)
        made += 1
    except Exception as e:
        print('skip', f, str(e)[:40])
print('png files:', made)
