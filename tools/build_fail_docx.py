"""导出「还没抓到 wiki」的曲目清单（抓取失败清单.docx），以当前数据状态为准。"""
import json
import os
from datetime import datetime

from docx import Document
from docx.shared import Pt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'source', '_data')

def load(name, default):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding='utf-8') as f:
        return json.load(f)

guide = load('chuni.json', {'songs': []})
extra = load('chuni_extra.json', {})
ids = load('chuni_ids.json', {})

missing = []
for s in guide.get('songs') or []:
    e = extra.get(s.get('id')) or {}
    if not (e.get('wiki_comment') or e.get('wiki_jp')):
        missing.append(s)

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10.5)
doc.add_heading('中二节奏 · 还没抓到 wiki 的曲目', 0)
doc.add_paragraph('生成时间：' + datetime.now().strftime('%Y-%m-%d %H:%M'))
doc.add_paragraph('共 %d 首（按当前数据状态统计）。' % len(missing))

table = doc.add_table(rows=1, cols=3)
table.style = 'Light Grid Accent 1'
for i, c in enumerate(['曲名', 'musicId', '版本']):
    table.rows[0].cells[i].text = c
for s in missing:
    row = table.add_row().cells
    row[0].text = str(s.get('title') or '')
    row[1].text = str(ids.get(s.get('title'), '') if isinstance(ids, dict) else '')
    row[2].text = str(s.get('version') or '')

out = os.path.join(ROOT, '抓取失败清单.docx')
doc.save(out)
print('saved', out, len(missing))
