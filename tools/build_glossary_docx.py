# 生成术语表 docx v4：含谱师名义碎片 + 谱师总表
import json
import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'chuni-glossary.json'), encoding='utf-8'))
designers_all = json.load(open(os.path.join(ROOT, '_tmp', 'designers-all.json'), encoding='utf-8'))

seed = data['seed']
auto = data['auto']
design_terms = data.get('designerTerms', [])
terms = [a for a in auto if a.get('kind') in ('术语', '作品')]
names = [a for a in auto if a.get('kind') == '名称']
pending = [a for a in auto if a.get('kind') not in ('术语', '作品', '名称')]

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(2)
sec.right_margin = Cm(2)
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color)
    tcPr.append(shd)


def add_table(rows, headers):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        shade(hdr[i], 'DCE9F2')
    for row in rows:
        cells = table.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(str(v))
            r.font.size = Pt(9)


doc.add_heading('中二节奏 wiki 翻译术语表（v4）', level=1)
p = doc.add_paragraph()
p.add_run('说明：').bold = True
p.add_run('这版用谱师 wiki 的 62 位谱师 + 1197 个谱面署名做了匹配，把拆开的谱师名义单独拎出来了。改完发回来我更新到翻译流程。')

doc.add_heading('一、已拟定的术语', level=2)
add_table([[r['category'], r['jp'], r['zh'], r['note'], r['occurrences']] for r in seed],
          ['分类', '日文', '建议译名', '备注', '出现次数'])

doc.add_heading('二、补充术语（语境补译）', level=2)
add_table([[r['jp'], r['zh'], r['kind'], r['occurrences']] for r in terms],
          ['日文', '建议译名', '类别', '出现次数'])

doc.add_heading('三、名称类（保留原文）', level=2)
add_table([[r['jp'], r['zh'], r['occurrences']] for r in names], ['日文', '说明', '出现次数'])

if pending:
    doc.add_heading('四、待定 / 碎片', level=2)
    add_table([[r['jp'], r['occurrences']] for r in pending], ['日文', '出现次数'])

if design_terms:
    doc.add_heading('五、被拆开的谱师名义（不译）', level=2)
    doc.add_paragraph('这些是谱师署名被片假名切词切断的碎片，翻译时保留完整日文原名。')
    add_table([[r['jp'], r['zh'], r['occurrences']] for r in design_terms],
              ['碎片', '对应谱师名义', '出现次数'])

doc.add_heading('六、谱师总表（62 位，含别名）', level=2)
roster = []
for d in designers_all:
    aliases = []
    for line in d.get('profile', []):
        if line.startswith('漢字表記：') or line.startswith('別名義：') or line.startswith('英字表記：'):
            v = line.split('：', 1)[1]
            for a in v.replace('*', ' ').split('、'):
                a = a.strip()
                if a and a not in aliases:
                    aliases.append(a)
    roster.append([d['name'], ' / '.join(aliases)])
add_table(roster, ['谱师名', '别名 / 汉字表记'])

out = os.path.join(ROOT, '中二节奏术语表-v4.docx')
doc.save(out)
print('seed', len(seed), 'terms', len(terms), 'names', len(names), 'pending', len(pending), 'design', len(design_terms), 'roster', len(roster))
