# 生成术语表 docx v6：依据列按萌百语料自动核对
import json
import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'chuni-glossary.json'), encoding='utf-8'))

ref_text = ''
for f in ['CHUNITHM.txt', '梗.txt', '用语.txt']:
    p = os.path.join(ROOT, '_tmp', 'refs', f)
    if os.path.exists(p):
        ref_text += open(p, encoding='utf-8').read() + '\n'


def hits(zh):
    base = zh.split(' / ')[0].split('（')[0].strip()
    if not base:
        return 0
    return ref_text.count(base)


seed = data['seed']
auto = data['auto']
design_terms = data.get('designerTerms', [])
terms = [a for a in auto if a.get('kind') in ('术语', '作品')]
names = [a for a in auto if a.get('kind') == '名称']
pending = [a for a in auto if a.get('kind') not in ('术语', '作品', '名称')]

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(1.6)
sec.right_margin = Cm(1.6)
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(9)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), color)
    tcPr.append(shd)


def add_table(rows, headers, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h)
        r.bold = True
        r.font.size = Pt(8)
        shade(hdr[i], 'DCE9F2')
    for row in rows:
        cells = table.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(str(v))
            r.font.size = Pt(8)


doc.add_heading('中二节奏 wiki 翻译术语表（v8）', level=1)
p = doc.add_paragraph()
p.add_run('核对方式：').bold = True
p.add_run('把「建议译名」拿去萌娘百科的 CHUNITHM 条目、音乐游戏/用语、音乐游戏/梗三页里查，出现过的标「萌百·出现（次数）」；查不到的标「待核对」。本轮据此改了 7 条译名（见表一里带 * 的备注）。')

doc.add_heading('一、已拟定的术语', level=2)
rows = []
for r in seed:
    n = hits(r['zh'])
    basis = f'萌百·出现（{n}）' if n else '待核对'
    rows.append([r['category'], r['jp'], r['zh'], basis, r['occurrences']])
add_table(rows, ['分类', '日文', '建议译名', '依据', '出现次数'])

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
    add_table([[r['jp'], r['zh'], r['occurrences']] for r in design_terms],
              ['碎片', '对应谱师名义', '出现次数'])

doc.add_heading('六、谱师总表（62 位，含别名）', level=2)
designers_all = json.load(open(os.path.join(ROOT, '_tmp', 'designers-all.json'), encoding='utf-8'))
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

out = os.path.join(ROOT, '中二节奏术语表-v8.docx')
doc.save(out)
print('saved', os.path.getsize(out))
