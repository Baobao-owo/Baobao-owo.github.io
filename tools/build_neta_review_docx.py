# 生成 neta 查证清单 docx
import json, os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r'D:\Deepseek work\blog'
data = json.load(open(os.path.join(ROOT, '_tmp', 'neta-evidence.json'), encoding='utf-8'))

strong = [e for e in data if e['score'] >= 10]
weak = [e for e in data if 0 < e['score'] < 10]
empty = [e for e in data if e['score'] == 0]

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


def table(rows, headers, widths=None):
    tb = doc.add_table(rows=1, cols=len(headers))
    tb.style = 'Table Grid'; tb.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = tb.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = ''
        r = hdr[i].paragraphs[0].add_run(h); r.bold = True; r.font.size = Pt(8)
        shade(hdr[i], 'DCE9F2')
    for row in rows:
        cells = tb.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''
            r = cells[i].paragraphs[0].add_run(str(v)); r.font.size = Pt(7.5)


def top(e):
    return e['hits'][0] if e['hits'] else None


def snip(e, n=90):
    h = top(e)
    if not h:
        return ''
    s = h.get('snippet') or ''
    return s[:n] + ('…' if len(s) > n else '')


def url(e):
    h = top(e)
    return h.get('url', '') if h else ''


doc.add_heading('中二节奏 neta 查证清单', level=1)
p = doc.add_paragraph()
p.add_run('说明：').bold = True
p.add_run('由后台普查脚本按「有由来 / 带引号 / 带外文」筛出候选，再逐首用 Bing 抓摘要并按关键词与来源打分。')
p = doc.add_paragraph(
    f'共 {len(data)} 首：强证据 {len(strong)} 首，弱证据 {len(weak)} 首，无证据 {len(empty)} 首。'
    '完整证据（含链接）在 _tmp/neta-evidence.json。'
)

doc.add_heading('一、强证据（score ≥ 10）', level=2)
doc.add_paragraph('优先看这批：摘要里同时出现了曲名和元ネタ/称号/譜面等关键词。')
table([[e['song'], e['score'], top(e)['title'][:40] if top(e) else '', snip(e)] for e in strong],
      ['曲目', '分', '来源标题', '摘要片段'])

doc.add_heading('二、弱证据（1–9 分）', level=2)
table([[e['song'], e['score'], snip(e)] for e in weak], ['曲目', '分', '摘要片段'])

doc.add_heading('三、无证据（需换引擎补查）', level=2)
doc.add_paragraph('这些 Bing 没给出可用摘要，之后用 DDG 代理或直接翻剧情站补。')
names = [e['song'] for e in empty]
for i in range(0, len(names), 4):
    doc.add_paragraph('、'.join(names[i:i + 4]))

out = os.path.join(ROOT, '中二节奏-neta查证清单.docx')
doc.save(out)
print('saved', os.path.getsize(out), 'strong', len(strong), 'weak', len(weak), 'empty', len(empty))
