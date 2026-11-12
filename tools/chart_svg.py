"""把 CHUNITHM 的 .c2s 谱面渲染成竖向平面图 SVG。

用法: python tools/chart_svg.py <chart.c2s> <out.svg> [--px 60]
"""
import sys
import os

LANES = 12
LANE_W = 24
LEFT = 46
TOP = 44
PX_PER_MEASURE = 60

COLOR = {
    'TAP': '#4f9de0',
    'CHR': '#f0a03c', 'HLD': '#f0a03c',
    'SLD': '#e05a5a', 'SLC': '#e05a5a',
    'AIR': '#63c86a', 'AHD': '#63c86a',
    'AUR': '#63c86a', 'AUL': '#63c86a', 'ADR': '#63c86a', 'ADL': '#63c86a',
    'FLK': '#b46ed8',
}
NOTE_TAGS = set(COLOR.keys())


def parse(path):
    header = {}
    bpm_changes = []
    met_changes = []
    notes = []
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        for raw in f:
            line = raw.rstrip('\n')
            if not line.strip():
                continue
            p = line.split('\t')
            tag = p[0]
            if tag == 'BPM' and len(p) >= 4:
                bpm_changes.append((int(p[1]), int(p[2]), float(p[3])))
            elif tag == 'MET' and len(p) >= 5:
                met_changes.append((int(p[1]), int(p[2]), int(p[3]), int(p[4])))
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
    return header, bpm_changes, met_changes, notes, res


def render(path, out, px_per_measure=PX_PER_MEASURE):
    header, bpm_changes, met_changes, notes, res = parse(path)
    if not notes:
        print('no notes:', path)
        return

    def tick_of(n):
        return n['m'] * res + n['t']

    min_measure = min(n['m'] for n in notes)
    max_tick = max(tick_of(n) for n in notes)
    measures = max(1, max_tick // res + 1)
    height = TOP + int(((max_tick - min_measure * res) / res) * px_per_measure) + 24
    width = LEFT + LANES * LANE_W + 76

    base_tick = min_measure * res

    def y(tick):
        return TOP + ((tick - base_tick) / res) * px_per_measure

    notes.sort(key=lambda n: (tick_of(n), n['pos']))
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
    parts.append(f'<rect width="{width}" height="{height}" fill="#1b2027"/>')

    # 泳道
    for i in range(LANES + 1):
        x = LEFT + i * LANE_W
        parts.append(f'<line x1="{x}" y1="{TOP}" x2="{x}" y2="{height - 20}" stroke="#262e37"/>')

    # 小节 + 拍线
    for m in range(min_measure, min_measure + measures):
        y0 = y(m * res)
        parts.append(f'<line x1="{LEFT}" y1="{y0}" x2="{LEFT + LANES * LANE_W}" y2="{y0}" stroke="#3d4753" stroke-width="1"/>')
        parts.append(f'<text x="{LEFT - 8}" y="{y0 + 4}" fill="#7c8894" font-size="10" text-anchor="end">{m + 1}</text>')
        for beat in (1, 2, 3):
            yb = y0 + beat * px_per_measure / 4
            parts.append(f'<line x1="{LEFT}" y1="{yb}" x2="{LEFT + LANES * LANE_W}" y2="{yb}" stroke="#2b333d" stroke-dasharray="2 6"/>')

    # BPM 变化
    for m, t, b in bpm_changes:
        yb = y(m * res + t)
        parts.append(f'<line x1="{LEFT}" y1="{yb}" x2="{LEFT + LANES * LANE_W}" y2="{yb}" stroke="#e8c15a" stroke-width="1.5" stroke-dasharray="6 4"/>')
        parts.append(f'<text x="{LEFT + LANES * LANE_W + 8}" y="{yb + 4}" fill="#e8c15a" font-size="11">BPM {b:g}</text>')

    def rect(x, yb, w, h, color, rx=2, opacity=1.0):
        parts.append(f'<rect x="{x:.1f}" y="{yb - h / 2:.1f}" width="{w:.1f}" height="{h}" rx="{rx}" fill="{color}" opacity="{opacity}"/>')

    # 长条：CHR 起点 → 后续 HLD 终点
    holds = {}
    for n in notes:
        if n['type'] == 'CHR':
            holds[('H', n['pos'])] = n
    for n in notes:
        if n['type'] == 'HLD':
            start = holds.get(('H', n['pos']))
            if not start:
                continue
            y1 = y(tick_of(start))
            y2 = y(tick_of(n))
            if y2 > y1:
                x = LEFT + start['pos'] * LANE_W + 3
                w = max(1, start['w']) * LANE_W - 6
                parts.append(f'<rect x="{x:.1f}" y="{y1:.1f}" width="{w:.1f}" height="{y2 - y1:.1f}" rx="4" fill="{COLOR["HLD"]}" opacity="0.55"/>')
            holds.pop(('H', n['pos']), None)

    # 滑条：SLD 起点 + 后续 SLC 控制点/终点
    slide = None
    for n in notes:
        if n['type'] == 'SLD':
            if slide:
                draw_slide(parts, slide, y, res)
            slide = [n]
        elif n['type'] == 'SLC' and slide is not None:
            slide.append(n)
            if len(slide) >= 2 and n.get('t') is not None:
                pass
    if slide:
        draw_slide(parts, slide, y, res)

    # 单点音符
    for n in notes:
        if n['type'] in ('CHR', 'HLD', 'SLD', 'SLC'):
            continue
        x = LEFT + n['pos'] * LANE_W
        w = max(1, min(n['w'], LANES - n['pos'])) * LANE_W
        yb = y(tick_of(n))
        color = COLOR.get(n['type'], '#999')
        if n['type'] in ('AIR', 'AHD', 'AUR', 'AUL', 'ADR', 'ADL'):
            parts.append(f'<circle cx="{x + w / 2:.1f}" cy="{yb:.1f}" r="4" fill="{color}"/>')
        elif n['type'] == 'FLK':
            parts.append(f'<rect x="{x:.1f}" y="{yb - 3:.1f}" width="{w:.1f}" height="6" rx="3" fill="{color}"/>')
        else:
            parts.append(f'<rect x="{x:.1f}" y="{yb - 2.5:.1f}" width="{w:.1f}" height="5" rx="2.5" fill="{color}"/>')

    parts.append('</svg>')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(parts))
    print('wrote', out, f'{width}x{height}', 'notes:', len(notes), 'measures:', measures)


def draw_slide(parts, points, y, res):
    if len(points) < 2:
        return
    coords = []
    for p in points:
        x = LEFT + p['pos'] * LANE_W + LANE_W / 2
        yb = y(p['m'] * res + p['t'])
        coords.append((x, yb))
    d = ' '.join(f'{x:.1f},{yb:.1f}' for x, yb in coords)
    parts.append(f'<polyline points="{d}" fill="none" stroke="{COLOR["SLD"]}" stroke-width="4" stroke-linecap="round" opacity="0.9"/>')


if __name__ == '__main__':
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else 'out.svg'
    px = 60
    if '--px' in sys.argv:
        px = int(sys.argv[sys.argv.index('--px') + 1])
    render(src, dst, px)
