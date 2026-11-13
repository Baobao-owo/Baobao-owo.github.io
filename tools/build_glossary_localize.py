# 术语表「本地化修订版」：只放术语行，留一列给你改
import json
import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'chuni-glossary.json'), encoding='utf-8'))

ref = ''
for f in ['CHUNITHM.txt', '梗.txt', '用语.txt']:
    p = os.path.join(ROOT, '_tmp', 'refs', f)
    if os.path.exists(p):
        ref += open(p, encoding='utf-8').read()

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(1.5)
sec.right_margin = Cm(1.5)
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


def table(rows, headers):
    tb = doc.add_table(rows=1, cols=len(headers))
    tb.style = 'Table Grid'
    tb.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = tb.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h)
        r.bold = True
        r.font.size = Pt(8)
        shade(hdr[i], 'DCE9F2')
    for row in rows:
        cells = tb.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(str(v))
            r.font.size = Pt(8)


doc.add_heading('中二节奏术语表 · 本地化修订版', level=1)
p = doc.add_paragraph()
p.add_run('怎么用：').bold = True
p.add_run('最后一列「你的修订」留空，直接在里面写你更顺口的说法；不想动的留空即可。改完发我，我按这列覆盖到翻译流程。')
p = doc.add_paragraph()
p.add_run('依据：').bold = True
p.add_run('标「萌百·N」表示这个译名在萌娘百科原文里出现过 N 次；标「待核对」是我按上下文拟的。')

rows = []
for r in data['seed']:
    base = r['zh'].split(' / ')[0].split('（')[0].strip()
    n = ref.count(base) if base else 0
    basis = f'萌百·{n}' if n else '待核对'
    rows.append([r['category'], r['jp'], r['zh'], basis, r['occurrences'], ''])

table(rows, ['分类', '日文', '当前译名', '依据', '出现次数', '你的修订'])

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('另外几条不算术语、但翻译时会用到的处理方式：').bold = True
for line in [
    '称号：短句意译，引用保留「」，出处放由来里，不塞进称号。',
    '作品名：优先用官方中文（如《蔚蓝档案》）；官方标语「一切奇迹的起点」优先于直译。',
    '曲名 / 谱师名 / 角色名：保留原文，不译。',
    '梗：直译会丢梗时，意译 + 由来里补一句解释，不编造。',
    '限定词（据说 / 似乎 / 被认为）：保留，不删。',
]:
    doc.add_paragraph(line, style='List Bullet')

out = os.path.join(ROOT, '中二节奏术语表-本地化版.docx')
doc.save(out)
print('saved', os.path.getsize(out), 'rows', len(rows))
