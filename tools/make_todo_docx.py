# 生成「待确认清单」docx
import io
from docx import Document
from docx.shared import Pt

OUT = r"D:\Deepseek work\blog\_tmp\待确认清单.docx"

SECTIONS = [
    ("一、谱师数据", [
        ("制作者不明还剩 54 张谱", "谱师索引里 7864 张谱中有 54 张仍标着「制作者不明」，来自 wiki 的「制作者不明」名单。这些要么真的没署名，要么是我没对上别名。", "要不要我导出这 54 条的曲名+难度给你，你帮忙认一下？"),
        ("「其他名义」从 508 变成 0", "接入游戏本体 CREATOR 数据后，原来的 508 个拼接名义（如「A supported by B」）全被归并到正式谱师，现在「其他名义」是空的。这可能符合预期，也可能吞掉了本该独立的名义（比如恶搞名义、合作组合名）。", "你确认一下：「其他名义」为 0 是你要的效果吗？"),
        ("合作分工表只覆盖 17 首", "wiki 曲目页里有「担当箇所 / 担当ND」表的曲子目前抓到 17 首（BATTLE NO.1、Caliburne、Crossmythos Rhapsodia 等）。理论上合作曲不止这些。", "如果你知道还有哪些合作曲有详细分工，给曲名，我去补抓。"),
        ("B/A 谱师来自游戏本体", "BASIC / ADVANCED 的谱师全部来自本地 c2s 的 CREATOR 字段（D 盘 X V X 的 data/A000），wiki 不显示这两档。", "确认这个来源可信吗？如果游戏里 CREATOR 是占位名，就要换。"),
    ]),
    ("二、删除曲数据", [
        ("版本大多来自 wiki 单曲页", "140 首删除曲中 49 首的版本仍是默认的 CHUNITHM（因为 wiki 那页没写或没抓到）。", "是否接受「默认 CHUNITHM」，还是希望我按列表分组的「▼ 至 XX 版本」反推？"),
        ("删除标记有两个来源", "目前删除标记来自 sdvx.in 名单 + wiki「配信終了」列表，两边合并。已排除「删了又复活」的 7 首（FLOWER 等）。", "有没有你熟悉但站上没标删除的曲？给曲名我查。"),
        ("地区标记默认 jp+intl", "补录的删除曲，regions 一律按「日服+国际服都有」。", "有没有只在一侧配信过的删除曲需要区分？"),
    ]),
    ("三、谱师留言（会报搬运）", [
        ("540 条留言里 90 条没有日文原文", "对方站有些条目只有中文，或中日块数对不上，我按顺序配对时丢了日文。", "这 90 条保持只有中文可以吗？"),
        ("287 条「小标题」没收", "会报里像「前言」「结尾」「关于 ADVANCED」「データ管理」这类段落标题，不是单曲评论，全部跳过。", "你标绿的那批已经收完，剩下这些确认不用管？"),
        ("中文是站主的机翻，我只做了术语统一", "比如「音符→note」「谱面师→谱师」，明显错译和「的的」类语病扫过一遍，但没有逐句精修。", "精修可以分批做，一次 100 条左右。要不要排期？"),
        ("期数标签写法", "目前是「7/8/9/10/11 周年会报」和「企鹅秘话 第 N 话」。", "如果要改成「第 N 期」这种，说一声。"),
    ]),
    ("四、翻译与术语", [
        ("删除曲介绍 142 首已翻完", "日文原文来自 wiki 情報段落，中文是我翻的，术语按「单曲／片头曲／联动活动／封面／稼动」统一。", "有些专有名词（如「粪谱三铳士」）我直译了，要本地化吗？"),
        ("没去萌娘百科核对术语", "你说可以查萌娘百科，但我这次是靠常识统一，没有逐条核对。", "需要的话我可以针对人名/作品名再核一遍。"),
    ]),
    ("五、视觉与交互", [
        ("曲绘有 2011 张仍是外链", "补录的 140 首删除曲曲绘已下载进仓库；其余 2011 首仍是 cloudfront 外链。", "要不要全部下载进仓库？会多几十 MB，仓库变重。"),
        ("谱面预览只覆盖删除曲 + 部分老曲", "共 552 张，来自本地 c2s 渲染。WE 谱和较新的谱没有预览。", "要不要继续渲染？渲染 1 张约 5 秒。"),
        ("两个会话同时改同一个仓库", "我们和另一个会话都在改这个站，出现过默认值互相覆盖（删除曲默认显示/隐藏）。", "以后要不要固定一个会话改站，另一个只读？"),
    ]),
]

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(10)

doc.add_heading("博客 · 待确认清单", level=1)
doc.add_paragraph("按「现状 / 为什么不确定 / 需要你确认什么」整理，一共 17 项。看完挑要紧的回我就行，不着急的可以放着。")

for title, items in SECTIONS:
    doc.add_heading(title, level=2)
    t = doc.add_table(rows=1, cols=3)
    t.style = "Light Grid Accent 1"
    hdr = t.rows[0].cells
    for i, h in enumerate(["项目", "现状 / 疑问", "需要你确认"]):
        hdr[i].text = h
        for run in hdr[i].paragraphs[0].runs:
            run.font.bold = True
            run.font.size = Pt(9)
    for name, now, ask in items:
        cells = t.add_row().cells
        for i, v in enumerate([name, now, ask]):
            cells[i].text = v
            for p in cells[i].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(9)

doc.save(OUT)
print("saved", OUT)
