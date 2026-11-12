"""汇总全量搬运里「需要人来定」的地方，导出成 Word（中二节奏-待决策清单.docx）。

用法: python tools/build_decision_docx.py
"""
import json
import os
from datetime import datetime

from docx import Document
from docx.shared import Pt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'source', '_data')


def load(name, default):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding='utf-8') as f:
        return json.load(f)


guide = load('chuni.json', {'songs': []})
extra = load('chuni_extra.json', {})
confirm = load('chuni_confirm.json', {})
youtube = load('chuni_youtube.json', {})
ids = load('chuni_ids.json', {})

fail_reasons = {}
fail_log = os.path.join(ROOT, '_tmp', 'wiki-fail.jsonl')
if os.path.exists(fail_log):
    with open(fail_log, encoding='utf-8') as f:
        for line in f:
            try:
                j = json.loads(line)
                fail_reasons[j.get('id')] = ' / '.join(j.get('reasons') or [])
            except Exception:
                pass

songs = guide['songs']
total = len(songs)

no_wiki, no_comment, no_zh = [], [], []
miss_bili, miss_yt, miss_both = [], [], []

for s in songs:
    e = extra.get(s['id']) or {}
    ja = e.get('wiki_comment') or e.get('wiki_jp')
    if not ja:
        no_wiki.append(s)
    elif not e.get('wiki_comment'):
        no_comment.append(s)
    if ja and not e.get('wiki_comment_zh'):
        no_zh.append(s)

    diffs = [sh for sh in s.get('sheets', []) if sh['difficulty'] in ('master', 'ultima')]
    cm = confirm.get(s['title']) or {}
    yt = youtube.get(s['title']) or {}
    letters = ['M' if sh['difficulty'] == 'master' else 'U' for sh in diffs]
    b_ok = any(cm.get(l) for l in letters)
    y_ok = any(yt.get(l) for l in letters)
    if not b_ok:
        miss_bili.append(s)
    if not y_ok:
        miss_yt.append(s)
    if not b_ok and not y_ok:
        miss_both.append(s)

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Microsoft YaHei'
style.font.size = Pt(10.5)


def h(text, level=1):
    doc.add_heading(text, level=level)


def para(text):
    doc.add_paragraph(text)


def table_of(rows, header):
    if not rows:
        para('（无）')
        return
    table = doc.add_table(rows=1, cols=len(header))
    table.style = 'Light Grid Accent 1'
    for i, c in enumerate(header):
        table.rows[0].cells[i].text = c
    for r in rows:
        cells = table.add_row().cells
        for i, v in enumerate(r):
            cells[i].text = str(v)


h('中二节奏 · 全量搬运待决策清单', 0)
para('生成时间：' + datetime.now().strftime('%Y-%m-%d %H:%M'))
para('')

h('一、总体进度', 1)
para(f'曲目总数：{total}')
para(f'有日文 wiki 内容：{total - len(no_wiki)}')
para(f'已机翻（有中文）：{total - len(no_zh)}')
para(f'有 B 站确认（紫/黑）：{total - len(miss_bili)}')
para(f'有 YouTube 确认（紫/黑）：{total - len(miss_yt)}')
para('')

h('二、需要你决定的分类', 1)

h('A. 没抓到 wiki 内容的曲目（%d）' % len(no_wiki), 2)
para('失败原因里 err/blocked 是抓取被 Cloudflare 拦或页面不存在；可以核对曲名写法，或后台手动补。')
table_of(
    [[s['title'], ids.get(s['title'], ''), s.get('version', ''), fail_reasons.get(s['id'], '还未尝试')] for s in no_wiki[:100]],
    ['曲名', 'musicId', '版本', '抓取结果'],
)

h('B. 有文本但没解析出「情報」段落（%d）' % len(no_comment), 2)
para('页面结构不同或介绍为空，建议抽查几条。')
table_of([[s['title'], ids.get(s['title'], '')] for s in no_comment[:60]], ['曲名', 'musicId'])

h('C. 还没翻译的曲目（%d）' % len(no_zh), 2)
para('翻译接口限流会留在队列，重跑 tools/translate_batch.mjs 会补。')
table_of([[s['title'], ids.get(s['title'], '')] for s in no_zh[:60]], ['曲名', 'musicId'])

h('D. 紫/黑谱没有 B 站确认（%d）' % len(miss_bili), 2)
para('B 站合集只覆盖部分版本/难度。')
table_of([[s['title'], ids.get(s['title'], ''), s.get('version', '')] for s in miss_bili[:60]], ['曲名', 'musicId', '版本'])

h('E. 紫/黑谱没有 YouTube 确认（%d）' % len(miss_yt), 2)
para('sdvx.in 没收录，或曲名没匹配上。')
table_of([[s['title'], ids.get(s['title'], ''), s.get('version', '')] for s in miss_yt[:60]], ['曲名', 'musicId', '版本'])

h('F. 两边都没有确认视频（%d）' % len(miss_both), 2)
table_of([[s['title'], ids.get(s['title'], ''), s.get('version', '')] for s in miss_both[:60]], ['曲名', 'musicId', '版本'])

para('')
h('三、自动处理规则（不用决定）', 1)
para('· 曲名匹配：NFKC 归一化、去括号空格、大小写不敏感、完全相等才算匹配。')
para('· 同一难度两条 YouTube 取后一条（9 速）。')
para('· 称号颜色按 wiki 格子底色映射：灰=一般、银、金、白金。')
para('· 定数履历按 wiki 脚注区间拆开，填精确定数。')
para('· 机翻只翻「情報」段落，结构化字段不翻。')

out = os.path.join(ROOT, '中二节奏-待决策清单.docx')
doc.save(out)
print('saved', out)
print('no_wiki', len(no_wiki), 'no_comment', len(no_comment), 'no_zh', len(no_zh),
      'miss_bili', len(miss_bili), 'miss_yt', len(miss_yt), 'miss_both', len(miss_both))
