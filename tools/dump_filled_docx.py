from docx import Document
import json

d = Document('谱师-其他名义待指派清单.docx')
t = d.tables[-1]
rows = []
for r in t.rows:
    rows.append([c.text.strip() for c in r.cells])
with open('_tmp/filled-assignments.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)
print('rows', len(rows))
