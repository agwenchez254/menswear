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


def svg(shadow: str, label: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 -246 700 392" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>
<g transform="rotate(-4 {CX} {CY})">
<rect x="{X + 12}" y="{Y + 12}" width="{W}" height="{H}" rx="{R}" fill="{shadow}"/>
<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{R}" fill="{LIME}" stroke="{INK}" stroke-width="7"/>
{''.join(letters)}
<polygon points="{burst(473.58, -149.95, 62, 40, 12)}" fill="{INK}" stroke-linejoin="round" stroke="{INK}" stroke-width="6"/>
<circle fill="{BONE}" cx="473.58" cy="-149.95" r="30" stroke="{INK}" stroke-width="5"/>
{pill}
</g>
</svg>
"""


(BRAND / "jabali-sassy-burst-light.svg").write_text(svg(INK, "light"), encoding="utf8")
(BRAND / "jabali-sassy-burst-dark.svg").write_text(svg(BONE, "dark"), encoding="utf8")
print("wrote jabali-sassy-burst-light.svg and jabali-sassy-burst-dark.svg")
