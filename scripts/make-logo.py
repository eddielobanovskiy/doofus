"""Generates docs/logo.svg: the DOOFUS logo, drawn like it was made in MS Paint with a mouse.
Every stroke is jittered on purpose. Run: python3 scripts/make-logo.py"""
import math, random, os

random.seed(67)  # funny number

def wobble(pts, step=6, amp=2.6):
    out = []
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x2 - x1, y2 - y1) / step))
        for i in range(n):
            t = i / n
            out.append((x1 + (x2 - x1) * t + random.uniform(-amp, amp), y1 + (y2 - y1) * t + random.uniform(-amp, amp)))
    out.append(pts[-1])
    return out

def ellipse(cx, cy, rx, ry, n=28, lump=0.0):
    return [(cx + math.cos(a) * rx * (1 + random.uniform(-lump, lump)), cy + math.sin(a) * ry * (1 + random.uniform(-lump, lump)))
            for a in [i * 2 * math.pi / n for i in range(n + 1)]]

def d(pts):
    return "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)

def stroke(pts, color, w, extra=""):
    return f'<path d="{d(pts)}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'

def blob(pts, fill, line="#000", w=5):
    return f'<path d="{d(pts)}Z" fill="{fill}" stroke="{line}" stroke-width="{w}" stroke-linejoin="round"/>'

# Letters on a 60x100 grid
L = {
    "D": [[(0, 0), (0, 100)], [(0, 0), (28, 4), (52, 26), (56, 52), (50, 76), (28, 96), (0, 100)]],
    "O": [ellipse(28, 50, 28, 50, 22)],
    "F": [[(46, 0), (0, 0), (0, 100)], [(0, 48), (36, 46)]],
    "U": [[(0, 0), (0, 68), (8, 90), (28, 100), (48, 90), (56, 68), (56, 0)]],
    "S": [[(54, 12), (40, 0), (16, 0), (2, 14), (6, 36), (28, 48), (50, 60), (56, 82), (42, 99), (16, 100), (0, 86)]],
}
COLORS = ["#b6ff00", "#ff2bd6", "#39e6ff", "#fff200", "#ff6a00", "#a95cff"]

parts = []
W, H = 800, 300

# MS Paint "paint bucket" background blob, not quite filling the space
bg = ellipse(420, 160, 370, 125, 40, 0.07)
parts.append(blob(bg, "#fff200", "#000", 6))
# a second, worse blob behind the face
parts.append(blob(ellipse(118, 162, 104, 100, 30, 0.08), "#ff2bd6", "#000", 6))

# --- the doofus face (cross-eyed, lopsided, one tooth, tongue out)
parts.append('<g id="dfface">')
face = ellipse(118, 166, 82, 88, 34, 0.06)
parts.append(blob(face, "#7ee05a", "#000", 7))
# ears, different sizes
parts.append(blob(wobble([(44, 140), (6, 104), (52, 112), (44, 140)], 5, 1.5), "#7ee05a", "#000", 6))
parts.append(blob(wobble([(192, 132), (226, 70), (200, 124), (192, 132)], 5, 1.5), "#7ee05a", "#000", 6))
# three hairs
for (x, y, x2, y2) in [(100, 80, 92, 48), (118, 78, 124, 40), (134, 82, 152, 56)]:
    parts.append(stroke(wobble([(x, y), (x2, y2)], 5, 2), "#000", 5))
# eyes: one huge, one tiny, both looking inward
parts.append(blob(ellipse(86, 148, 30, 34, 24, 0.05), "#fff", "#000", 5))
parts.append(blob(ellipse(156, 146, 16, 17, 20, 0.05), "#fff", "#000", 5))
parts.append(blob(ellipse(106, 156, 10, 10, 14, 0.04), "#000", "#000", 2))
parts.append(blob(ellipse(146, 150, 6, 6, 12, 0.04), "#000", "#000", 2))
# eyebrow (only one)
parts.append(stroke(wobble([(130, 118), (172, 112)], 5, 2), "#000", 7))
# mouth, tongue, single tooth
mouth = wobble([(72, 206), (100, 222), (142, 218), (168, 198)], 6, 2)
parts.append(stroke(mouth, "#000", 7))
parts.append(blob(wobble([(108, 220), (106, 246), (124, 254), (134, 238), (130, 218)], 5, 1.4), "#ff5b8a", "#000", 5))
parts.append(blob(wobble([(84, 212), (98, 216), (94, 232), (84, 212)], 4, 1), "#fff", "#000", 4))
# sweat drop
parts.append(blob(wobble([(198, 168), (190, 190), (198, 198), (206, 190), (198, 168)], 4, 1), "#39e6ff", "#000", 4))

parts.append("</g>")

# --- the word, every letter a different size, tilt and color
x = 236
for i, ch in enumerate("DOOFUS"):
    s = random.uniform(1.05, 1.32)
    rot = random.uniform(-12, 12)
    y0 = 92 + random.uniform(-16, 20)
    g = []
    for seg in L[ch]:
        pts = wobble([(px * s, py * s) for px, py in seg], 6, 2.2)
        g.append(stroke(pts, "#000", 26))
    for seg in L[ch]:
        pts = wobble([(px * s, py * s) for px, py in seg], 6, 1.6)
        g.append(stroke(pts, COLORS[i], 14))
    cx, cy = 28 * s, 50 * s
    parts.append(f'<g transform="translate({x:.1f},{y0:.1f}) rotate({rot:.1f} {cx:.1f} {cy:.1f})">{"".join(g)}</g>')
    x += 56 * s + random.uniform(12, 22)

# lazy hand-scribbled TM
tm = '<g transform="translate(748,74) rotate(14)">' + \
     stroke(wobble([(0, 0), (16, 0)], 4, 1), "#000", 4) + stroke(wobble([(8, 0), (8, 22)], 4, 1), "#000", 4) + \
     stroke(wobble([(22, 22), (22, 0), (30, 14), (38, 0), (38, 22)], 4, 1), "#000", 4) + '</g>'
parts.append(tm)

# clip-art sparkle in the wrong place
def star(cx, cy, r):
    pts = []
    for k in range(9):
        a = k * math.pi / 4 - math.pi / 2
        rr = r if k % 2 == 0 else r * 0.32
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return blob(wobble(pts, 5, 1.2), "#fff", "#000", 4)
parts.append(star(222, 54, 26))
parts.append(star(640, 262, 18))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="DOOFUS logo">
{chr(10).join(parts)}
</svg>
'''
os.makedirs("docs", exist_ok=True)
open("docs/logo.svg", "w").write(svg)
print("wrote docs/logo.svg", len(svg), "bytes")
