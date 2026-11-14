import fs from 'node:fs';
import path from 'node:path';

const py = 'C:/Users/33303/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe';
const src = '_tmp/bili-opus.html';

const script = `
import io, re
from lxml import html
doc = html.fromstring(io.open('${src}', encoding='utf-8').read())
def walk(el, depth=0, out=None):
    if out is None: out = []
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else '?'
        cls = (c.get('class') or '')[:40]
        txt = (c.text_content() or '').strip()[:40].replace('\\n',' ')
        out.append('  '*depth + tag + (' .' + cls if cls else '') + (' :: ' + txt if txt else ''))
        if depth < 3 and len(c):
            walk(c, depth+1, out)
    return out
lines = walk(doc.body)
open('_tmp/bili-opus-structure.txt','w',encoding='utf-8').write('\\n'.join(lines))
print('lines', len(lines))
`;
fs.writeFileSync('_tmp/inspect_opus.py', script, 'utf8');
console.log('written');
