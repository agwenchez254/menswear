"""
Builds the "burst" Jabali logo: the men's sassy letterforms on a tilted lime sticker with a hard offset shadow, a
starburst behind the i-dot and an inverted "atelier" pill. Reads public/brand/jabali-sassy-men-light.svg so the
letter shapes stay exactly the brand's own. Run from the project root: python scripts/brand-burst.py
"""
import math
import re
from pathlib import Path

BRAND = Path(__file__).resolve().parent.parent / "public" / "brand"
src = (BRAND / "jabali-sassy-men-light.svg").read_text(encoding="utf8")

INK = "#111311"
LIME = "#c6e24f"
BONE = "#eceee8"

pill = re.search(r"<g\b.*?</g>", src, flags=re.S).group(0)
rest = src.replace(pill, "")
letters = re.findall(r'<path fill="#111311"[^>]*/>', rest)[:6]
assert len(letters) == 6, len(letters)

# Inside the pill group: lime rect + ink text. Invert them so the pill reads as a dark tag on the lime sticker.
pill = re.sub(r'<rect fill="#c6e24f" stroke="#eef0ec"', f'<rect fill="{INK}" stroke="{LIME}"', pill)
pill = re.sub(r'<path fill="#111311"', f'<path fill="{LIME}"', pill)


def burst(cx, cy, outer, inner, points):
    pts = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner
        a = math.pi * i / points - math.pi / 2
        pts.append(f"{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}")
    return " ".join(pts)


# Sticker geometry in the original logo's coordinate space.
X, Y, W, H, R = -52, -214, 604, 318, 46
CX, CY = X + W / 2, Y + H / 2


def zigzag(x0, x1, y_base, h, step):
    """A row of upward triangles, like a row of beads on a Maasai collar."""
    tris = []
    x = x0
    while x + step <= x1 + 0.01:
        tris.append(f"M{x:.2f} {y_base:.2f}L{x + step / 2:.2f} {y_base - h:.2f}L{x + step:.2f} {y_base:.2f}Z")
        x += step
    return "".join(tris)


def diamonds(x0, x1, cy, w, h):
    """A chain of diamonds: ink outer, bone centre."""
    out, inn = [], []
    x = x0 + w / 2
    while x + w / 2 <= x1 + 0.01:
        out.append(f"M{x - w / 2:.2f} {cy:.2f}L{x:.2f} {cy - h / 2:.2f}L{x + w / 2:.2f} {cy:.2f}L{x:.2f} {cy + h / 2:.2f}Z")
        inn.append(f"M{x - w / 5:.2f} {cy:.2f}L{x:.2f} {cy - h / 5:.2f}L{x + w / 5:.2f} {cy:.2f}L{x:.2f} {cy + h / 5:.2f}Z")
        x += w
    return "".join(out), "".join(inn)


def beadwork() -> str:
    """Maasai-beadwork-inspired bands in the sticker's free edges. Ink and bone only, so the one-accent rule holds."""
    top = zigzag(-34, 396, -174, 26, 26)
    d_out, d_in = diamonds(-34, 536, 86, 32, 26)
    return f"""<g>
<path d="{top}" fill="{INK}"/>
<path d="M-34 -176H396" stroke="{INK}" stroke-width="4"/>
<path d="M-34 70H536" stroke="{INK}" stroke-width="4"/>
<path d="M-34 106H536" stroke="{INK}" stroke-width="4"/>
<path d="{d_out}" fill="{INK}"/>
<path d="{d_in}" fill="{BONE}"/>
</g>"""


def svg(shadow: str, label: str, african: bool = False) -> str:
    bands = f"<clipPath id=\"sticker\"><rect x=\"{X}\" y=\"{Y}\" width=\"{W}\" height=\"{H}\" rx=\"{R}\"/></clipPath>\n<g clip-path=\"url(#sticker)\">{beadwork()}</g>" if african else ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 -246 700 392" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>
<g transform="rotate(-4 {CX} {CY})">
<rect x="{X + 12}" y="{Y + 12}" width="{W}" height="{H}" rx="{R}" fill="{shadow}"/>
<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{R}" fill="{LIME}" stroke="{INK}" stroke-width="7"/>
{bands}
{''.join(letters)}
<polygon points="{burst(473.58, -152, 54, 38, 12)}" fill="{INK}" stroke-linejoin="round" stroke="{INK}" stroke-width="6"/>
<circle fill="{BONE}" cx="473.58" cy="-149.95" r="30" stroke="{INK}" stroke-width="5"/>
{pill}
</g>
</svg>
"""


(BRAND / "jabali-sassy-burst-light.svg").write_text(svg(INK, "light"), encoding="utf8")
(BRAND / "jabali-sassy-burst-dark.svg").write_text(svg(BONE, "dark"), encoding="utf8")
print("wrote jabali-sassy-burst-light.svg and jabali-sassy-burst-dark.svg")

# African-touch variation: same logo with beadwork-inspired bands. Named for the shuka, the Maasai cloth.
(BRAND / "jabali-sassy-shuka-light.svg").write_text(svg(INK, "light", african=True), encoding="utf8")
(BRAND / "jabali-sassy-shuka-dark.svg").write_text(svg(BONE, "dark", african=True), encoding="utf8")
print("wrote jabali-sassy-shuka-light.svg and jabali-sassy-shuka-dark.svg")
