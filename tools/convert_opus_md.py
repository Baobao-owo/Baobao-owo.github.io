# 把 B 站专栏 HTML 片段转成 Markdown（图片先占位，稍后下载替换）
import io, re, json
from lxml import html

SRC = '_tmp/bili-opus.html'
OUT_MD = '_tmp/bili-opus.md'
OUT_IMGS = '_tmp/bili-opus-imgs.json'

raw = io.open(SRC, encoding='utf-8').read()
root = html.fragment_fromstring(raw, create_parent='root')

imgs = []
blocks = []


def fix_href(href):
    if not href:
        return ''
    if href.startswith('//'):
        return 'https:' + href
    return href


def inline(el, skip_img=False):
    parts = []
    if el.text:
        parts.append(el.text)
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else ''
        if tag == 'br':
            parts.append('\n')
        elif tag == 'img':
            if skip_img:
                pass
            else:
                src = c.get('src') or ''
                alt = (c.get('alt') or '').strip()
                if src and 'garb' in src:
                    imgs.append(src)
                    parts.append('![](%s)' % ('{{IMG:%d}}' % (len(imgs) - 1)))
                elif src:
                    imgs.append(src)
                    parts.append('\n\n{{IMG:%d}}\n\n' % (len(imgs) - 1))
                    if alt:
                        parts.append('*%s*\n\n' % alt)
        elif tag == 'a':
            href = fix_href(c.get('href') or '')
            text = inline(c, skip_img=True).strip()
            if text and href:
                parts.append('[%s](%s)' % (text, href))
            elif text:
                parts.append(text)
        elif tag in ('strong', 'b'):
            t = inline(c, skip_img).strip()
            if t:
                parts.append('**%s**' % t)
        elif tag in ('em', 'i'):
            t = inline(c, skip_img).strip()
            if t:
                parts.append('*%s*' % t)
        else:
            parts.append(inline(c, skip_img))
        if c.tail:
            parts.append(c.tail)
    return ''.join(parts)


def walk(el):
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else ''
        if tag in ('script', 'style', 'button'):
            continue
        if tag in ('h1', 'h2', 'h3', 'h4'):
            level = int(tag[1])
            txt = inline(c).strip().replace('\n', ' ')
            if txt:
                blocks.append('#' * level + ' ' + txt)
        elif tag == 'p':
            txt = inline(c).strip()
            if txt:
                blocks.append(txt)
        elif tag == 'hr':
            blocks.append('---')
        elif tag == 'img':
            src = c.get('src') or ''
            if src:
                imgs.append(src)
                blocks.append('{{IMG:%d}}' % (len(imgs) - 1))
        elif tag == 'figure':
            txt = inline(c).strip()
            if txt:
                blocks.append(txt)
        elif tag in ('ul', 'ol'):
            for li in c:
                if isinstance(li.tag, str) and li.tag == 'li':
                    t = inline(li).strip()
                    if t:
                        blocks.append('- ' + t.replace('\n', ' '))
        elif tag == 'blockquote':
            t = inline(c).strip()
            if t:
                blocks.append('> ' + t.replace('\n', '> '))
        else:
            before = len(blocks)
            walk(c)
            if len(blocks) == before:
                t = inline(c).strip()
                if t:
                    blocks.append(t)


walk(root)

md = '\n\n'.join(b.strip() for b in blocks if b.strip())
md = re.sub(r'\n{3,}', '\n\n', md)
io.open(OUT_MD, 'w', encoding='utf-8').write(md)
io.open(OUT_IMGS, 'w', encoding='utf-8').write(json.dumps(imgs, ensure_ascii=False, indent=1))
print('blocks', len(blocks), 'imgs', len(imgs), 'md chars', len(md))
