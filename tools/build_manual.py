# 生成博客使用说明 docx
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ACCENT = RGBColor(0x3F, 0x6B, 0x8A)
CODE_FILL = "F1F4F8"
CODE_FONT = "Consolas"


def set_east_asia(style_or_run, font_name):
    rpr = style_or_run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:eastAsia"), font_name)


def shade(paragraph, fill):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    pPr.append(shd)


def code_block(doc, lines):
    for i, line in enumerate(lines):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.3)
        p.paragraph_format.space_before = Pt(2 if i == 0 else 0)
        p.paragraph_format.space_after = Pt(2 if i == len(lines) - 1 else 0)
        p.paragraph_format.line_spacing = 1.1
        shade(p, CODE_FILL)
        run = p.add_run(line)
        run.font.name = CODE_FONT
        run.font.size = Pt(9.5)
        set_east_asia(run, "微软雅黑")


def body(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.25
    if bold_prefix:
        r = p.add_run(bold_prefix)
        r.bold = True
    p.add_run(text)
    return p


def bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.22
    if bold_prefix:
        r = p.add_run(bold_prefix)
        r.bold = True
    p.add_run(text)
    return p


def step(doc, n, text):
    """有序步骤：普通段落 + 悬挂缩进，避免出现「• 1.」双标记。"""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.95)
    p.paragraph_format.first_line_indent = Cm(-0.55)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.22
    r = p.add_run(f"{n}. ")
    r.bold = True
    p.add_run(text)
    return p


doc = Document()

sec = doc.sections[0]
sec.top_margin = Cm(1.7)
sec.bottom_margin = Cm(1.7)
sec.left_margin = Cm(2.2)
sec.right_margin = Cm(2.2)

normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.5)
set_east_asia(normal, "微软雅黑")

for name, size in (("Heading 1", 14), ("Heading 2", 11.5)):
    st = doc.styles[name]
    st.font.name = "Calibri"
    st.font.size = Pt(size)
    st.font.color.rgb = ACCENT
    st.font.bold = True
    st.paragraph_format.space_before = Pt(11)
    st.paragraph_format.space_after = Pt(4)
    set_east_asia(st, "微软雅黑")

# 标题
t = doc.add_heading("宝宝的小站 · 使用说明", level=0)
t.paragraph_format.space_after = Pt(4)
sub = doc.add_paragraph()
sub.paragraph_format.space_after = Pt(14)
r = sub.add_run("Hexo 8 + Argon 主题，冷蓝灰配色。已经上线：https://baobao-owo.github.io/")
r.font.size = Pt(9.5)
r.font.color.rgb = RGBColor(0x6B, 0x77, 0x83)

# 一
doc.add_heading("一、本地怎么打开", level=1)
body(doc, "项目在 D:\\Deepseek work\\blog。命令行进到目录，跑：")
code_block(doc, ['cd "D:\\Deepseek work\\blog"', "npm run dev"])
body(doc, "然后浏览器打开 http://127.0.0.1:4000 。改文章或配置，保存后刷新浏览器就能看到，不用重启。")
bullet(doc, "本地预览", "npm run dev　")
bullet(doc, "生成静态文件到 public/（上线用的就是它）", "npm run build　")
bullet(doc, "清缓存；改了主题配置没生效时先跑这个", "npm run clean　")
body(doc, "注意别用 npx hexo，它会解析到别的二进制，只会显示 init 和 version 两个命令。", "提醒：")

# 二
doc.add_heading("二、发一篇文章", level=1)
code_block(doc, ['npm run new -- "文章标题"'])
body(doc, "会在 source/_posts/ 生成一个 md 文件，开头用三条横线包起来的这段叫 front-matter：")

table = doc.add_table(rows=1, cols=3)
table.style = "Table Grid"
hdr = table.rows[0].cells
for cell, text in zip(hdr, ("字段", "说明", "例子")):
    cell.text = ""
    run = cell.paragraphs[0].add_run(text)
    run.bold = True
    run.font.size = Pt(9.5)
    shade(cell.paragraphs[0], "E8EEF4")

rows = [
    ("title", "标题", "15 级谱面研究：先读谱，再上手"),
    ("date", "发布时间", "2026-11-08 21:15:00"),
    ("categories", "分类，只能一个", "游戏"),
    ("tags", "标签，可以多个", "[CHUNITHM, 谱面研究, 音游]"),
]
for field, desc, example in rows:
    cells = table.add_row().cells
    for i, text in enumerate((field, desc, example)):
        cells[i].text = ""
        run = cells[i].paragraphs[0].add_run(text)
        run.font.size = Pt(9.5)
        if i == 0:
            run.font.name = CODE_FONT
            set_east_asia(run, "微软雅黑")

doc.add_paragraph().paragraph_format.space_after = Pt(0)
body(doc, "正文用 Markdown 写。想让首页只显示摘要，就在想截断的地方单独加一行 <!--more-->，这行上面的内容会当成摘要。")
body(doc, "图片放 source/assets/img/，文章里用 ![说明](/assets/img/文件名.jpg) 引用。")

# 三
doc.add_heading("三、换外观", level=1)
bullet(doc, "站名、副标题、作者：_config.yml 里的 title / subtitle / author", "")
bullet(doc, "主题色：source/_data/argon.yml 的 theme_color，现在是冷钢蓝 #4f7f9c", "")
bullet(doc, "进站封面：同一文件里的 banner_background_url。换图之后，裁切位置在 source/assets/css/baobao.css 搜 background-position（现在是 center 62%），数字调大画面往下移", "")
bullet(doc, "头像：argon.yml 的 sidebar_auther_image", "")
bullet(doc, "模板是 themes/argon/layout/home.ejs，按分类自动分块，块内列最近 5 篇；样式在 baobao.css 里 home-sections 那段", "首页板块：")
bullet(doc, "顶栏菜单 toolbar_menu、侧栏菜单 leftbar_menu、页脚那行字 footer_html", "")
body(doc, "封面上那层冷色雾也在 baobao.css（section#banner.banner 的第一层渐变）：画面太灰就把透明度调小，标题看不清就调大。")

# 四
doc.add_heading("四、看板娘（已移除）", level=1)
body(doc, "之前挂过 live2d，现在页面上没有。想加回来：")
step(doc, 1, "npm i live2d-widget live2d-widget-model-shizuku")
step(doc, 2, "把 node_modules/live2d-widget/lib/ 和模型包里的 assets/ 拷进 source/assets/live2d/")
step(doc, 3, "在 argon.yml 的 custom_html_foot 里写一段 L2Dwidget.init(...)")

# 五
doc.add_heading("五、更新线上内容", level=1)
body(doc, "站点已经在 GitHub Pages 上：https://baobao-owo.github.io/ ，仓库是 Baobao-owo/Baobao-owo.github.io，main 分支自动构建。")
body(doc, "改完文章或样式，跑一条命令就会构建并推上去：")
code_block(doc, ["npm run publish"])
body(doc, "这条命令会清缓存、重新构建、再推上去，等一两分钟刷新线上页面就更新了。只跑 npm run deploy 有时会漏更新，用 publish 稳一点。推送凭据存在这台机器的 Windows 凭据管理器里，换电脑要重新登录一次。")

# 六
doc.add_heading("六、评论（giscus）", level=1)
body(doc, "评论存在仓库的 GitHub Discussions 里，类别是 Announcements，不用自己的服务器。")
body(doc, "仓库上要先装一次 giscus App，不然评论框只会显示 not installed：")
step(doc, 1, "打开 https://github.com/apps/giscus/installations/new")
step(doc, 2, "Repository access 选 Only select repositories，勾 Baobao-owo/Baobao-owo.github.io")
step(doc, 3, "点 Install，回文章页刷新，再点「使用 GitHub 登录」就能发评论")
body(doc, "配置在 source/_data/argon.yml 的 giscus 段，repo_id 和 category_id 已经填好。删评论、锁定讨论都去仓库的 Discussions 页面操作。")

# 七
doc.add_heading("七、主题改动记录", level=1)
body(doc, "主题是直接放在 themes/argon 里的，动过这几处，以后升级主题要重新应用一遍：")
bullet(doc, "header.ejs：去掉外链字体、去掉访问统计、favicon 指向本地、修了打字效果间隔读不到的 bug", "")
bullet(doc, "footer.ejs：去掉访问统计块", "")
bullet(doc, "archive.ejs：重写（原文件里「归档」两个字是坏字节）", "")
bullet(doc, "删掉主题自带的示例大图，省 1.6MB", "")
body(doc, "另外两处比较隐蔽，改的时候容易踩：")
bullet(doc, "封面的背景是主题写在 HTML 里的内联样式，覆盖必须用 section#banner.banner 这种带 id 的写法", "")
bullet(doc, "主题的代码高亮只认 WordPress 那种 pre.code，对 Hexo 代码块无效，配色是自己在 baobao.css 写的", "")

# 八
doc.add_heading("八、常见问题", level=1)
bullet(doc, "先 npm run clean，再 npm run build", "改了配置没变化 → ")
bullet(doc, "检查 baobao.css 里 figure.highlight 那段还在不在，以及 _config.yml 的 highlight.enable 是不是开着", "代码块没颜色 → ")
bullet(doc, "调 baobao.css 里那层渐变的透明度，或者换一张对比度更高的封面", "封面上标题看不清 → ")
bullet(doc, "仓库上还没装 giscus App，按第六章那三步装一次", "评论框显示 not installed → ")

doc.core_properties.title = "宝宝的小站 · 使用说明"
out = r"D:\Deepseek work\blog\博客使用说明.docx"
doc.save(out)
print("saved", out)
