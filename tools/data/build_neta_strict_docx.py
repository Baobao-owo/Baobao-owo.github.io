# 生成严格版 neta 线索清单（只保留高置信）
import json, os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'neta-evidence-strict.json'), encoding='utf-8'))
strict = data['strict']
weak = data['weak']

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


doc.add_heading('中二节奏 neta 线索清单（严格版）', level=1)
p = doc.add_paragraph()
p.add_run('重要：').bold = True
p.add_run('这份清单只是「线索」，不是结论。每条都必须在写进译文的由来之前人工确认（比如点是同名但无关的条目、神话/宗教条目、其他作品里的同名曲）。上一版没有这个限制，错配很多，这版已经收紧。')

p = doc.add_paragraph()
p.add_run('收紧规则：').bold = True
p.add_run('摘要里必须同时出现「曲名（或去掉括号后的核心名）」和「元ネタ/モチーフ/パロディ/称号/譜面 等关键词」，或来源属于可信站点（wikiwiki / gamerch / atwiki / utaten / niconico / 萌百 / B站 / 百度百科等）。')

doc.add_paragraph(f'高置信线索 {len(strict)} 首；另有 {len(weak)} 首只有低置信结果，未列入表格，翻译时不要直接引用。')

table = doc.add_table(rows=1, cols=5)
table.style = 'Table Grid'; table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = table.rows[0].cells
for i, h in enumerate(['曲目', '分', '来源', '标题', '摘要（需核实）']):
    hdr[i].text = ''
    r = hdr[i].paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(8)
    shade(hdr[i], 'DCE9F2')

for e in strict:
    for h in e['hits'][:3]:
        cells = table.add_row().cells
        host = ''
        try:
            host = h['url'].split('/')[2]
        except Exception:
            host = h.get('url', '')
        snip = (h.get('snippet') or '')[:110]
        vals = [e['song'], h.get('score', ''), host, (h.get('title') or '')[:50], snip]
        for i, v in enumerate(vals):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(str(v)); r.font.size = Pt(7.5)

out = os.path.join(ROOT, '中二节奏-neta线索清单-严格版.docx')
doc.save(out)
print('saved', os.path.getsize(out), 'strict', len(strict))
