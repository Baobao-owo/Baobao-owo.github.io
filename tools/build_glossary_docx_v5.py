# 生成术语表 docx v5：加「依据」列，标注是否经萌娘百科核对
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

# 已用萌娘百科核对的词（来源：萌百 CHUNITHM 条目 / 音乐游戏·用语）
VERIFIED = {
    '譜面': '萌百·用语',
    '定数': '萌百·用语 + CHUNITHM',
    '物量': '萌百·用语',
    'ノーツ': '萌百·CHUNITHM（Note）',
    'タップ': '萌百·CHUNITHM',
    'ホールド': '萌百·CHUNITHM',
    'スライド': '萌百·CHUNITHM',
    'フリック': '萌百·CHUNITHM',
    'エアー': '萌百·CHUNITHM',
    'エアクラッシュ': '萌百·CHUNITHM（AIR-CRUSH）',
    '判定': '萌百·CHUNITHM',
    'スキル': '萌百·CHUNITHM',
    'レベル': '萌百·CHUNITHM（等级）',
    'クレジット': '萌百·CHUNITHM（投币/Credit）',
    'チュウニズム': '萌百·CHUNITHM（官方译名「中二节奏」）',
    'クラス認定': '萌百·CHUNITHM（CLASS 认定）',
    'WORLD\'S END': '萌百·CHUNITHM',
    'バージョン': '萌百·CHUNITHM（版本）',
    '称号': '待核对',
    '解禁': '萌百·CHUNITHM（解禁/解锁）',
    'フルコンボ': '萌百·用语（FC）',
    'オールジャスティス': '待核对',
    '譜師': '萌百·用语（谱师）'
}

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


def add_table(rows, headers):
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


doc.add_heading('中二节奏 wiki 翻译术语表（v5）', level=1)
p = doc.add_paragraph()
p.add_run('说明：').bold = True
p.add_run('这一版加了「依据」列——只有标了萌娘百科来源的，才是我真的上网核对过的；其余是按上下文和专业习惯拟的，需要你或有空时再核。')

doc.add_heading('一、已拟定的术语', level=2)
rows = []
for r in seed:
    basis = VERIFIED.get(r['jp'], '模型推断（待核对）')
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

out = os.path.join(ROOT, '中二节奏术语表-v5.docx')
doc.save(out)
print('saved', os.path.getsize(out))
