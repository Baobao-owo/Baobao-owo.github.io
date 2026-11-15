# 生成第二批 20 首翻译审阅稿
import json, os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'batch2-translated.json'), encoding='utf-8'))
guide = json.load(open(os.path.join(ROOT, 'source/_data/chuni.json'), encoding='utf-8'))
facts = {s['title']: s for s in guide['songs']}

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(1.4); sec.right_margin = Cm(1.4)
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'; style.font.size = Pt(9)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')


def shade(cell, color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:val'), 'clear'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:fill'), color)
    tcPr.append(shd)


doc.add_heading('中二节奏 wiki 翻译 · 第二批 20 首', level=1)
p = doc.add_paragraph()
p.add_run('约定：').bold = True
p.add_run('曲名/谱师名/角色名保留原文；作品名用官方中文；称号短句意译；引用保留「」。链接 VERSE 系列按剧情站的官方译名（尤尼、旋律异化、大门、代码等）。')

for song in data:
    doc.add_heading(song['song'], level=2)
    f = facts.get(song['song'])
    if f:
        fp = doc.add_paragraph()
        r = fp.add_run(f"曲库：{f.get('category')} / {f.get('artist')} / {f.get('version')}")
        r.font.size = Pt(8); r.italic = True
    table = doc.add_table(rows=1, cols=4)
    table.style = 'Table Grid'; table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for i, h in enumerate(['类型', '日文原文', '中文译文', '备注']):
        hdr[i].text = ''
        rr = hdr[i].paragraphs[0].add_run(h); rr.bold = True; rr.font.size = Pt(8)
        shade(hdr[i], 'DCE9F2')
    for item in song['items']:
        cells = table.add_row().cells
        for i, v in enumerate([item['type'], item['jp'], item['zh'], item['note']]):
            cells[i].text = ''
            rr = cells[i].paragraphs[0].add_run(str(v)); rr.font.size = Pt(8)

out = os.path.join(ROOT, '中二节奏翻译-第二批20首-v2.docx')
doc.save(out)
print('saved', os.path.getsize(out), 'songs', len(data))
