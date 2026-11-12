"""把 preview 目录下的 PNG 批量转成 WebP，并删掉原 PNG。"""
import os
import sys
from PIL import Image

d = sys.argv[1] if len(sys.argv) > 1 else 'source/assets/chuni/preview'
total_before = total_after = 0
for name in sorted(os.listdir(d)):
    if not name.lower().endswith('.png'):
        continue
    src = os.path.join(d, name)
    dst = os.path.join(d, name[:-4] + '.webp')
    before = os.path.getsize(src)
    im = Image.open(src).convert('RGB')
    im.save(dst, 'WEBP', quality=82, method=6)
    after = os.path.getsize(dst)
    os.remove(src)
    total_before += before
    total_after += after
    print(f'{name} {before/1024:.0f}KB -> {os.path.basename(dst)} {after/1024:.0f}KB')
print(f'total {total_before/1024/1024:.2f}MB -> {total_after/1024/1024:.2f}MB')
