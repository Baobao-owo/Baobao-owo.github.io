"""把国服已删除曲目导出成 Word（国服已删除曲目.docx）。"""
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

cn_removed = load('chuni_cn_removed.json', {'matched': [], 'unmatched': []})
matched = cn_removed.get('matched') or []

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10.5)
doc.add_heading('国服已删除曲目', 0)
doc.add_paragraph('生成时间：' + datetime.now().strftime('%Y-%m-%d %H:%M'))
doc.add_paragraph('来源：maimai.lxns.net 版本快照对比（覆盖 NEW 之后的版本）')
doc.add_paragraph('共 %d 首' % len(matched))

table = doc.add_table(rows=1, cols=3)
table.style = 'Light Grid Accent 1'
for i, c in enumerate(['曲名', 'musicId', '初出难度版本']):
    table.rows[0].cells[i].text = c
for s in matched:
    row = table.add_row().cells
    row[0].text = str(s.get('title') or '')
    row[1].text = str(s.get('id') or '')
    row[2].text = str(s.get('version') or '')

out = os.path.join(ROOT, '国服已删除曲目.docx')
doc.save(out)
print('saved', out, len(matched))
