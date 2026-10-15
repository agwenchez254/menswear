"""
Adds the Maasai-beadwork-inspired "shuka" touch (a row of triangles, a chain of diamonds, thin framing lines) to every
Jabali logo family, in each variant's own palette. Letterforms are never redrawn: this reads the existing SVGs in
public/brand and wraps them. Run from the project root: python scripts/brand-shuka.py

Outputs (men and women, light and dark):
  jabali-atelier-shuka-<gender>-<mode>.svg       bands above and below the italic lockup
  jabali-wordmark-shuka-<gender>-<mode>.svg      same, letters only
  jabali-mark-shuka-<gender>-<mode>.svg          bands inside the square tile
  jabali-sassy-mark-shuka-<gender>-<mode>.svg    a ring of beads inside the round tile
  jabali-sassy-shuka-<gender>-<mode>.svg         the tilted sticker with a burst (women; men lives in brand-burst.py)
"""
import math
import re
from pathlib import Path

BRAND = Path(__file__).resolve().parent.parent / "public" / "brand"

# fg: logo colour on a transparent page. ink: colour of marks drawn on the accent tile. bone: the light neutral.
PALETTES = {
    ("men", "light"): dict(fg="#111311", ink="#111311", acc="#c6e24f", bg="#eef0ec", bone="#eef0ec", shadow="#111311"),
    ("men", "dark"): dict(fg="#eceee8", ink="#0d0f0d", acc="#cfeb58", bg="#0d0f0d", bone="#eceee8", shadow="#eceee8"),
    ("women", "light"): dict(fg="#231a22", ink="#231a22", acc="#f29a76", bg="#f3eff1", bone="#f3eff1", shadow="#231a22"),
    ("women", "dark"): dict(fg="#f3edf0", ink="#171116", acc="#f5a07d", bg="#171116", bone="#f3edf0", shadow="#f3edf0"),
}


def inner(svg_text: str) -> str:
    """Everything inside the outer <svg>...</svg>."""
    return re.search(r"<svg[^>]*>(.*)</svg>", svg_text, flags=re.S).group(1)


def read(name: str) -> str:
    return (BRAND / name).read_text(encoding="utf8")


def zigzag(x0, x1, y_base, h, step):
    """A row of upward triangles, like a row of beads on a collar."""
    out, x = [], x0
    while x + step <= x1 + 0.01:
        out.append(f"M{x:.2f} {y_base:.2f}L{x + step / 2:.2f} {y_base - h:.2f}L{x + step:.2f} {y_base:.2f}Z")
        x += step
    return "".join(out)


def diamond_chain(x0, x1, cy, w, h):
    """Outer and inner diamond path strings for a chain of beads."""
    outer, core, x = [], [], x0 + w / 2
    while x + w / 2 <= x1 + 0.01:
        outer.append(f"M{x - w / 2:.2f} {cy:.2f}L{x:.2f} {cy - h / 2:.2f}L{x + w / 2:.2f} {cy:.2f}L{x:.2f} {cy + h / 2:.2f}Z")
        core.append(f"M{x - w / 5:.2f} {cy:.2f}L{x:.2f} {cy - h / 5:.2f}L{x + w / 5:.2f} {cy:.2f}L{x:.2f} {cy + h / 5:.2f}Z")
        x += w
    return "".join(outer), "".join(core)


def band_top(p, x0, x1, base, h, step, line=3.0):
    return f'<path d="{zigzag(x0, x1, base, h, step)}" fill="{p["fg"]}"/><path d="M{x0} {base + line}H{x1}" stroke="{p["fg"]}" stroke-width="{line}"/>'


def band_bottom(p, x0, x1, cy, w, h, line=3.0, centre=None, gap=None):
    outer, core = diamond_chain(x0, x1, cy, w, h)
    gap = gap if gap is not None else h / 2 + line * 2
    return (
        f'<path d="M{x0} {cy - gap}H{x1}" stroke="{p["fg"]}" stroke-width="{line}"/>'
        f'<path d="{outer}" fill="{p["fg"]}"/><path d="{core}" fill="{centre or p["acc"]}"/>'
    )


def write(name: str, text: str) -> None:
    (BRAND / name).write_text(text, encoding="utf8")


def lockup(family: str, gender: str, mode: str, p: dict, h: float) -> None:
    """Atelier and wordmark: bands sit in the free space above and below the letters."""
    src = read(f"jabali-{family}-{gender}-{mode}.svg")
    w = float(re.search(r'viewBox="0 0 ([\d.]+) ', src).group(1))
    # Extend the canvas above and below so the bands never touch the letters.
    pad = 44
    top = band_top(p, 20, w - 20, -14, 14, 14)
    bottom = band_bottom(p, 20, w - 20, h + 24, 20, 16)
    write(
        f"jabali-{family}-shuka-{gender}-{mode}.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-pad} {w} {h + 2 * pad}" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>{inner(src)}{top}{bottom}</svg>\n',
    )


def square_mark(gender: str, mode: str, p: dict) -> None:
    """The square j tile: bands inside the top and bottom of the tile, in the letter colour."""
    src = read(f"jabali-mark-{gender}-{mode}.svg")
    q = dict(p, fg=p["ink"])
    top = band_top(q, 70, 930, 112, 64, 64, line=9)
    bottom = band_bottom(q, 70, 930, 896, 72, 56, line=9, centre=p["bone"] if mode == "light" else p["acc"])
    write(
        f"jabali-mark-shuka-{gender}-{mode}.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="Jabali"><title>Jabali</title>{inner(src)}{top}{bottom}</svg>\n',
    )


def round_mark(gender: str, mode: str, p: dict) -> None:
    """The round j tile: a collar of beads around the inside edge."""
    src = read(f"jabali-sassy-mark-{gender}-{mode}.svg")
    ink = p["ink"]
    n, r_out, r_in = 40, 468, 408
    beads = []
    for i in range(n):
        a0 = 2 * math.pi * i / n
        a1 = 2 * math.pi * (i + 1) / n
        am = (a0 + a1) / 2
        pts = [(500 + r_out * math.cos(a0), 500 + r_out * math.sin(a0)), (500 + r_in * math.cos(am), 500 + r_in * math.sin(am)), (500 + r_out * math.cos(a1), 500 + r_out * math.sin(a1))]
        beads.append("M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z")
    ring = (
        f'<path d="{"".join(beads)}" fill="{ink}"/>'
        f'<circle cx="500" cy="500" r="{r_in - 8}" fill="none" stroke="{ink}" stroke-width="9"/>'
    )
    # The beads go under the letter so the j is never crossed.
    body = inner(src)
    j = re.search(r"<path.*?/>", body, flags=re.S).group(0)
    disc = body.replace(j, "")
    write(
        f"jabali-sassy-mark-shuka-{gender}-{mode}.svg",
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="Jabali"><title>Jabali</title>{disc}{ring}{j}</svg>\n',
    )


# ---- the tilted sticker (same construction as brand-burst.py) ----
X, Y, W, H, R = -52, -214, 604, 318, 46
CX, CY = X + W / 2, Y + H / 2


def burst(cx, cy, outer, inner_r, points):
    pts = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner_r
        a = math.pi * i / points - math.pi / 2
        pts.append(f"{cx + r * math.cos(a):.2f},{cy + r * math.sin(a):.2f}")
    return " ".join(pts)


def sticker(gender: str, mode: str, p: dict) -> None:
    src = read(f"jabali-sassy-{gender}-light.svg")  # letters in the light file are in the dark ink colour
    body = inner(src)
    pill = re.search(r"<g\b.*?</g>", body, flags=re.S).group(0)
    rest = body.replace(pill, "")
    light = PALETTES[(gender, "light")]
    letters = re.findall(r'<path fill="%s"[^>]*/>' % re.escape(light["fg"]), rest)[:6]
    assert len(letters) == 6, (gender, len(letters))
    ink, acc = p["ink"], p["acc"]
    letters = [s.replace(light["fg"], ink) for s in letters]
    pill = pill.replace(f'fill="{light["acc"]}" stroke="{light["bg"]}"', f'fill="{ink}" stroke="{acc}"').replace(f'<path fill="{light["fg"]}"', f'<path fill="{acc}"')
    q = dict(p, fg=ink)
    top = band_top(q, -34, 396, -174, 26, 26, line=4)
    bottom = band_bottom(q, -34, 536, 86, 32, 26, line=4, centre=p["bone"])
    bands = (
        f'<clipPath id="sticker"><rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{R}"/></clipPath>'
        f'<g clip-path="url(#sticker)">{top}<path d="M-34 70H536" stroke="{ink}" stroke-width="4"/>{bottom[bottom.index("<path d=") :] if False else bottom}</g>'
    )
    write(
        f"jabali-sassy-shuka-{gender}-{mode}.svg",
        f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-86 -246 700 392" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>
<g transform="rotate(-4 {CX} {CY})">
<rect x="{X + 12}" y="{Y + 12}" width="{W}" height="{H}" rx="{R}" fill="{p["shadow"]}"/>
<rect x="{X}" y="{Y}" width="{W}" height="{H}" rx="{R}" fill="{acc}" stroke="{ink}" stroke-width="7"/>
{bands}
{"".join(letters)}
<polygon points="{burst(473.58, -152, 54, 38, 12)}" fill="{ink}" stroke-linejoin="round" stroke="{ink}" stroke-width="6"/>
<circle fill="{p["bone"]}" cx="473.58" cy="-149.95" r="30" stroke="{ink}" stroke-width="5"/>
{pill}
</g>
</svg>
""",
    )


made = []
for (gender, mode), p in PALETTES.items():
    lockup("atelier", gender, mode, p, 234.96)
    lockup("wordmark", gender, mode, p, 174.24)
    square_mark(gender, mode, p)
    round_mark(gender, mode, p)
    if gender == "women":
        sticker(gender, mode, p)
    made.append(f"{gender}-{mode}")
print("wrote shuka variants for", ", ".join(made))
