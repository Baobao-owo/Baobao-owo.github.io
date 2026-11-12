"""把 wiki 抓取失败清单导出成 Word（抓取失败清单.docx）。

用法: python tools/build_fail_docx.py
"""
import json
import os
import traceback
from collections import Counter
from datetime import datetime

from docx import Document
from docx.shared import Pt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'source', '_data')
LOG = os.path.join(ROOT, '_tmp', 'wiki-fail.jsonl')

def load_json(name, default):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding='utf-8') as f:
        return json.load(f)

guide = load_json('chuni.json', {'songs': []})
songs = {}
for s in guide.get('songs') or []:
    if isinstance(s, dict) and s.get('id'):
        songs[s['id']] = s
ids = load_json('chuni_ids.json', {})

seen = []
if os.path.exists(LOG):
    with open(LOG, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                j = json.loads(line)
            except Exception:
                continue
            if not isinstance(j, dict):
                continue
            title = j.get('title') or j.get('id') or ''
            reasons = j.get('reasons') or []
            if isinstance(reasons, str):
                reasons = [reasons]
            reasons = [str(x) for x in reasons if x]
            r = ' / '.join(reasons)
            if any(t == title and rr == r for t, rr, _ in seen):
                continue
            seen.append((title, r, j))

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10.5)
doc.add_heading('中二节奏 · wiki 抓取失败清单', 0)
doc.add_paragraph('生成时间：' + datetime.now().strftime('%Y-%m-%d %H:%M'))
doc.add_paragraph('共 %d 条（按曲名+原因去重）。绝大多数是 429 限流或连接被重置，重抓一般能补上。' % len(seen))
doc.add_paragraph('')

table = doc.add_table(rows=1, cols=4)
table.style = 'Light Grid Accent 1'
for i, c in enumerate(['曲名', 'musicId', '版本', '失败原因']):
    table.rows[0].cells[i].text = c

for title, r, j in seen:
    s = songs.get(j.get('id')) or {}
    row = table.add_row().cells
    row[0].text = str(title)
    row[1].text = str(ids.get(title, '')) if isinstance(ids, dict) else ''
    row[2].text = str(s.get('version', ''))
    row[3].text = str(r)

out = os.path.join(ROOT, '抓取失败清单.docx')
doc.save(out)
print('saved', out, 'rows', len(seen))
