import json, os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'batch1-sample10-verified.json'), encoding='utf-8'))
doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(1.4); sec.right_margin = Cm(1.4)
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'; style.font.size = Pt(9)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')

def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'),'clear'); shd.set(qn('w:color'),'auto'); shd.set(qn('w:fill'),color)
    tcPr.append(shd)

doc.add_heading('中二节奏 wiki 翻译 · 首批 10 首（复核版）', level=1)
p = doc.add_paragraph()
p.add_run('复核依据：').bold = True
p.add_run('曲库 chuni.json 的 category / artist / version 字段 + copel-popn 剧情站。每首下面一行是曲库事实，「复核」列是逐条核对结果。')

for song in data:
    doc.add_heading(song['song'], level=2)
    fp = doc.add_paragraph()
    r = fp.add_run('曲库事实：' + song.get('factNote',''))
    r.font.size = Pt(8); r.italic = True
    table = doc.add_table(rows=1, cols=5)
    table.style = 'Table Grid'; table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i,h in enumerate(['类型','日文原文','中文译文','复核','备注']):
        hdr[i].text=''
        rr = hdr[i].paragraphs[0].add_run(h); rr.bold=True; rr.font.size=Pt(8)
        shade(hdr[i],'DCE9F2')
    for item in song['items']:
        cells = table.add_row().cells
        for i,v in enumerate([item['type'], item['jp'], item['zh'], item.get('check',''), item['note']]):
            cells[i].text=''
            rr = cells[i].paragraphs[0].add_run(str(v)); rr.font.size=Pt(8)

out = os.path.join(ROOT, '中二节奏翻译-首批10首复核版.docx')
doc.save(out)
print('saved', os.path.getsize(out))
