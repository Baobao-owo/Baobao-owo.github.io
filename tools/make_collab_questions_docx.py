import json, io, os, re
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

norm = lambda s: ''.join(str(s or '').split()).lower()

sus = json.load(io.open('_tmp/suspicious_credits.json', encoding='utf-8'))
q = json.load(io.open('_tmp/questionable_collab.json', encoding='utf-8'))
built = json.load(io.open('public/chuni-songs.json', encoding='utf-8'))
alias = json.load(io.open('source/_data/chuni_designer_alias.json', encoding='utf-8'))

title_of = {norm(s['t']): s['t'] for s in built}
wiki_yes = {norm(r['title']) for r in q if r['wiki']}

SPLIT = re.compile(r'(?:\s+vs\.?\s+|\s+VS\.?\s+|meets|＆|&|×|＋|1P[:：]|2P[:：])', re.I)


def alias_lookup(text):
    t = str(text or '').strip()
    if t in alias:
        return alias[t]
    for k in sorted(alias, key=len, reverse=True):
        if len(k) >= 4 and k in t:
            return alias[k]
    return None


def guess(raw):
    whole = alias_lookup(raw)
    if whole:
        return '别名表已确认整串 = %s（单人）' % whole
    parts = [p.strip(' †・*[]') for p in SPLIT.split(raw) if p and p.strip(' †・*[]')]
    if len(parts) < 2:
        return '看不出一分为二'
    names = [alias_lookup(p) or p for p in parts]
    uniq = sorted(set(names))
    if len(uniq) == 1:
        return '两半指向同一人：%s' % uniq[0]
    return '两半不同：%s' % ' + '.join(uniq)


a_rows = []
seen = set()
for s in sus:
    if s['cl'] != 1:
        continue
    key = (norm(s['title']), s['diff'])
    if key in seen:
        continue
    seen.add(key)
    a_rows.append({
        'title': title_of.get(norm(s['title']), s['title']),
        'diff': s['diff'],
        'raw': s['raw'],
        'who': s['who'],
        'guess': guess(s['raw']),
        'wiki': '有' if norm(s['title']) in wiki_yes else '无',
    })

b_rows = []
for r in q:
    if r['wiki']:
        continue
    if any(norm(x['title']) == norm(r['title']) for x in a_rows):
        continue
    b_rows.append(r)

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10.5)
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'Microsoft YaHei')

h = doc.add_heading('合作标记待确认清单', level=1)
h.alignment = WD_ALIGN_PARAGRAPH.CENTER

p = doc.add_paragraph()
p.add_run('怎么填：').bold = True
p.add_run('在「你的结论」列写「合作 / 单人 / 不确定」；不确定的随手写一句理由就行。')
p = doc.add_paragraph()
p.add_run('为什么重要：').bold = True
p.add_run('合作标记决定这首曲子在「仅显示合作」里出不出现。标错有两个方向——'
          '①单人写却被标成合作；②两人合作却被归成了一个人，这样按谱师筛选时查不到另一位。')

doc.add_paragraph()
doc.add_heading('A. 署名带 vs / ＆ / meets / 1P·2P，仍被标成合作的（%d 首）' % len(a_rows), level=2)
p = doc.add_paragraph()
p.add_run('「我的猜测」那列是查别名表得出的：如果整串在别名表里就对应某一位谱师，说明这是那人的自我恶搞、属单人；'
          '拆开后两半不同人的，才可能是真合作。')

t1 = doc.add_table(rows=1, cols=7)
t1.style = 'Light Grid Accent 1'
for i, t in enumerate(['曲名', '难度', '页面显示（原署名）', '数据归到', 'wiki 合作记录', '我的猜测', '你的结论']):
    t1.rows[0].cells[i].text = t
for r in a_rows:
    c = t1.add_row().cells
    for i, v in enumerate([r['title'], r['diff'], r['raw'], r['who'], r['wiki'], r['guess'], '']):
        c[i].text = v

doc.add_paragraph()
doc.add_heading('B. 只有「谱师学」文档列过、wiki 没写合作的（%d 首）' % len(b_rows), level=2)
p = doc.add_paragraph()
p.add_run('这些曲目每个难度都能归到具体的某位谱师，wiki 也没有合作记录，但 docx 名单里有。')

t2 = doc.add_table(rows=1, cols=4)
t2.style = 'Light Grid Accent 1'
for i, t in enumerate(['曲名', '各难度谱师', '我的判断', '你的结论']):
    t2.rows[0].cells[i].text = t
for r in b_rows:
    c = t2.add_row().cells
    c[0].text = r['title']
    c[1].text = r['per'].replace('\n', '；')
    c[2].text = '每个难度都是单人，倾向算单人曲'
    c[3].text = ''

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('补充：').bold = True
p.add_run('如果你觉得某一类标准很统一（比如「别名表能归到一个人的一律算单人」），直接说规则就行，我按规则批量处理，不用逐条填。')

for t, widths in ((t1, [Cm(4.0), Cm(1.5), Cm(4.2), Cm(2.6), Cm(2.0), Cm(4.2), Cm(2.0)]),
                  (t2, [Cm(4.4), Cm(7.6), Cm(3.4), Cm(2.2)])):
    for row in t.rows:
        for i, w in enumerate(widths):
            if i < len(row.cells):
                row.cells[i].width = w

out = '合作标记待确认清单.docx'
doc.save(out)
print('saved', out, os.path.getsize(out), 'bytes')
print('A:', len(a_rows), 'B:', len(b_rows))
