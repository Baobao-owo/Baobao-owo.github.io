"""把 CHUNITHM 的 .c2s 谱面渲染成「多列分栏」平面图 SVG（类似 bot 那种）。

用法: python tools/chart_svg.py <chart.c2s> <out.svg> [--measures 20]
"""
import sys
import os

LANES = 12
LANE_W = 11
COL_GAP = 14
MEASURES_PER_COL = 20
PX_PER_MEASURE = 58
TOP = 18
LEFT = 30
MARGIN_BOTTOM = 18

COLORS = {
    'TAP': '#e8d44d',
    'CHR': '#f0a03c', 'HLD': '#f0a03c',
    'SLD': '#4fd8e8', 'SLC': '#4fd8e8',
    'AIR': '#7be08a', 'AHD': '#7be08a',
    'AUR': '#7be08a', 'AUL': '#7be08a', 'ADR': '#7be08a', 'ADL': '#7be08a',
    'FLK': '#d86fe0',
}
NOTE_TAGS = set(COLORS.keys())


def parse(path):
    header, bpm_changes, notes = {}, [], []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for raw in f:
            line = raw.rstrip('\n')
            if not line.strip():
                continue
            p = line.split('\t')
            tag = p[0]
            if tag == 'BPM' and len(p) >= 4:
                bpm_changes.append((int(p[1]), int(p[2]), float(p[3])))
            elif tag in NOTE_TAGS:
                try:
                    m, t, pos = int(p[1]), int(p[2]), int(p[3])
                except (IndexError, ValueError):
                    continue
                width = 1
                if len(p) >= 5:
                    try:
                        width = max(1, int(p[4]))
                    except ValueError:
                        width = 1
                notes.append({'type': tag, 'm': m, 't': t, 'pos': pos, 'w': width})
            elif len(p) >= 2 and tag.isupper() and tag not in ('BPM', 'MET', 'SFL'):
                header[tag] = p[1:]
    res = 384
    if 'RESOLUTION' in header:
        try:
            res = int(header['RESOLUTION'][0])
        except ValueError:
            res = 384
    return header, bpm_changes, notes, res


def render(path, out, measures_per_col=MEASURES_PER_COL):
    header, bpm_changes, notes, res = parse(path)
    if not notes:
        print('no notes:', path)
        return

    notes.sort(key=lambda n: (n['m'] * res + n['t'], n['pos']))
    min_m = min(n['m'] for n in notes)
    max_m = max(n['m'] for n in notes)
    total = max_m - min_m + 1

    cols = (total + measures_per_col - 1) // measures_per_col
    col_w = LANES * LANE_W
    col_h = measures_per_col * PX_PER_MEASURE
    width = LEFT + cols * col_w + (cols - 1) * COL_GAP + 16
    height = TOP + col_h + MARGIN_BOTTOM

    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
    parts.append(f'<rect width="{width}" height="{height}" fill="#2f3742"/>')

    def col_x(i):
        return LEFT + i * (col_w + COL_GAP)

    def note_pos(n, col_index):
        local_m = n['m'] - min_m - col_index * measures_per_col
        y = TOP + (local_m + n['t'] / res) * PX_PER_MEASURE
        x = col_x(col_index) + n['pos'] * LANE_W
        return x, y

    # 分栏底 + 泳道 + 小节
    for i in range(cols):
        x0 = col_x(i)
        parts.append(f'<rect x="{x0}" y="{TOP}" width="{col_w}" height="{col_h}" fill="#242b34"/>')
        for lane in range(LANES + 1):
            lx = x0 + lane * LANE_W
            parts.append(f'<line x1="{lx}" y1="{TOP}" x2="{lx}" y2="{TOP + col_h}" stroke="#313a45"/>')
        start_m = min_m + i * measures_per_col
        for k in range(measures_per_col):
            m = start_m + k
            if m > max_m:
                break
            y = TOP + k * PX_PER_MEASURE
            parts.append(f'<line x1="{x0}" y1="{y}" x2="{x0 + col_w}" y2="{y}" stroke="#3c4652"/>')
            parts.append(f'<text x="{x0 + 2}" y="{y + 8}" fill="#6f7b87" font-size="7">{m + 1}</text>')
            for beat in (1, 2, 3):
                yb = y + beat * PX_PER_MEASURE / 4
                parts.append(f'<line x1="{x0}" y1="{yb}" x2="{x0 + col_w}" y2="{yb}" stroke="#2b333d" stroke-dasharray="1 5"/>')

    # BPM 变化
    for m, t, b in bpm_changes:
        ci = (m - min_m) // measures_per_col
        if ci < 0 or ci >= cols:
            continue
        x0 = col_x(ci)
        local_m = m - min_m - ci * measures_per_col
        y = TOP + (local_m + t / res) * PX_PER_MEASURE
        parts.append(f'<line x1="{x0}" y1="{y}" x2="{x0 + col_w}" y2="{y}" stroke="#e8c15a" stroke-width="1.2" stroke-dasharray="4 3"/>')
        parts.append(f'<text x="{x0 + col_w + 3}" y="{y + 3}" fill="#e8c15a" font-size="8">BPM {b:g}</text>')

    # 长条
    holds = {}
    for n in notes:
        if n['type'] == 'CHR':
            holds[n['pos']] = n
        elif n['type'] == 'HLD':
            s = holds.get(n['pos'])
            if not s:
                continue
            ci = (s['m'] - min_m) // measures_per_col
            if ci != (n['m'] - min_m) // measures_per_col:
                holds.pop(n['pos'], None)
                continue
            x, y1 = note_pos(s, ci)
            _, y2 = note_pos(n, ci)
            if y2 > y1:
                w = max(1, s['w']) * LANE_W - 2
                parts.append(f'<rect x="{x:.1f}" y="{y1:.1f}" width="{w:.1f}" height="{y2 - y1:.1f}" rx="2" fill="{COLORS["HLD"]}" opacity="0.75"/>')
            holds.pop(n['pos'], None)

    # 滑条
    slide = []
    for n in notes:
        if n['type'] == 'SLD':
            if slide:
                draw_slide(parts, slide, note_pos, min_m, measures_per_col)
            slide = [n]
        elif n['type'] == 'SLC' and slide:
            slide.append(n)
    if slide:
        draw_slide(parts, slide, note_pos, min_m, measures_per_col)

    # 单点
    for n in notes:
        if n['type'] in ('CHR', 'HLD', 'SLD', 'SLC'):
            continue
        ci = (n['m'] - min_m) // measures_per_col
        x, y = note_pos(n, ci)
        w = max(1, min(n['w'], LANES - n['pos'])) * LANE_W
        color = COLORS.get(n['type'], '#999')
        if n['type'] in ('AIR', 'AHD', 'AUR', 'AUL', 'ADR', 'ADL'):
            parts.append(f'<rect x="{x:.1f}" y="{y - 1.5:.1f}" width="{w:.1f}" height="3" rx="1.5" fill="{color}"/>')
        elif n['type'] == 'FLK':
            parts.append(f'<rect x="{x:.1f}" y="{y - 2:.1f}" width="{w:.1f}" height="4" rx="2" fill="{color}"/>')
        else:
            parts.append(f'<rect x="{x:.1f}" y="{y - 1.5:.1f}" width="{w:.1f}" height="3" rx="1.5" fill="{color}"/>')

    parts.append('</svg>')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))
    print('wrote', out, f'{width}x{height}', 'notes:', len(notes), 'cols:', cols)


def draw_slide(parts, points, note_pos, min_m, per_col):
    if len(points) < 2:
        return
    segs = {}
    for p in points:
        ci = (p['m'] - min_m) // per_col
        segs.setdefault(ci, []).append(p)
    for ci, pts in segs.items():
        if len(pts) < 2:
            continue
        coords = []
        for p in pts:
            x, y = note_pos(p, ci)
            coords.append((x + LANE_W / 2, y))
        d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in coords)
        parts.append(f'<polyline points="{d}" fill="none" stroke="{COLORS["SLD"]}" stroke-width="2.4" stroke-linecap="round" opacity="0.95"/>')


if __name__ == '__main__':
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else 'out.svg'
    per_col = MEASURES_PER_COL
    if '--measures' in sys.argv:
        per_col = int(sys.argv[sys.argv.index('--measures') + 1])
    render(src, dst, per_col)
