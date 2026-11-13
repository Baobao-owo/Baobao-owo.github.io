# 生成 10 首样例翻译审阅稿
import json
import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'batch1-sample10.json'), encoding='utf-8'))

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


doc.add_heading('中二节奏 wiki 翻译 · 首批 10 首样例', level=1)
p = doc.add_paragraph()
p.add_run('怎么用：').bold = True
p.add_run('每首一张表，左到右是「类型 / 日文原文 / 中文译文 / 备注」。有意见直接改中文列，或在备注里写；不满意的整行删掉也行。')
p = doc.add_paragraph()
p.add_run('约定：').bold = True
p.add_run('曲名、谱师名、角色名保留原文；作品名用官方中文；称号短句意译；引用保留「」。术语按术语表 v8（能量槽 / 投币 / CLASS 认定 / 曲绘 / 恶搞 / 下架 / 机厅）。')

for song in data:
    doc.add_heading(song['song'], level=2)
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(['类型', '日文原文', '中文译文', '备注']):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h)
        r.bold = True
        r.font.size = Pt(8)
        shade(hdr[i], 'DCE9F2')
    for item in song['items']:
        cells = table.add_row().cells
        for i, v in enumerate([item['type'], item['jp'], item['zh'], item['note']]):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(v)
            r.font.size = Pt(8)

out = os.path.join(ROOT, '中二节奏翻译-首批10首样例.docx')
doc.save(out)
print('saved', os.path.getsize(out), 'songs', len(data))
