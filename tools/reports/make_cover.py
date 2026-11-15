# 处理进站封面 + 头像（冷色系）：压缩、取主色、导出头像和 favicon
from PIL import Image
import os

SRC = r"C:\Users\33303\.dsh\attachments\v1\objects\b4\b49d79328ec3e164ab5dad1c31ade6678c0dd69d7dbdbb7db98f6fc9b29a6a75"
OUT = r"D:\Deepseek work\blog\source\assets\img"
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGB")
w, h = im.size
print("source", im.size)

# 主色（供配色参考）
q = im.resize((220, 140)).quantize(colors=10, method=Image.MEDIANCUT).convert("RGB")
print("--- dominant ---")
for cnt, c in sorted(q.getcolors(), reverse=True)[:8]:
    print(f"  #{c[0]:02x}{c[1]:02x}{c[2]:02x}  w={cnt}")

# 进站封面：保持比例压到 1920 宽
cover = im.resize((1920, round(h * 1920 / w)), Image.LANCZOS)
cover.save(os.path.join(OUT, "banner-euthanasia.jpg"), quality=84, optimize=True, progressive=True)
print("cover", cover.size, os.path.getsize(os.path.join(OUT, "banner-euthanasia.jpg")))

# 头像：白玫瑰 + 蓝色绣球那块
avatar = im.crop((1080, 320, 1480, 720)).resize((400, 400), Image.LANCZOS)
avatar.save(os.path.join(OUT, "avatar-flower.jpg"), quality=92, optimize=True)
print("avatar", avatar.size, os.path.getsize(os.path.join(OUT, "avatar-flower.jpg")))

# favicon / apple touch
avatar.resize((64, 64), Image.LANCZOS).save(os.path.join(OUT, "favicon-flower.ico"),
                                           sizes=[(64, 64), (32, 32), (16, 16)])
avatar.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "apple-touch-icon.png"))
print("done")
for f in sorted(os.listdir(OUT)):
    print(" ", f, os.path.getsize(os.path.join(OUT, f)))
