"""
"Geo" variation of the Jabali logo: the existing atelier lockup, sassy lockup and j tile with a restrained composition
of geometric shapes (disc, half and quarter discs, triangle), in the Bauhaus / Memphis spirit of trend-led fashion
branding. Three shapes per logo at most. Letterforms are read from the existing SVGs in public/brand, never redrawn, and only the brand's
own colours are used (one accent per palette).

Run from the project root: python scripts/brand-geo.py
Outputs: jabali-atelier-geo-, jabali-sassy-geo- and jabali-mark-geo-<gender>-<mode>.svg
"""
import re
from pathlib import Path

BRAND = Path(__file__).resolve().parent.parent / "public" / "brand"

PALETTES = {
    ("men", "light"): dict(fg="#111311", ink="#111311", acc="#c6e24f", bone="#eef0ec"),
    ("men", "dark"): dict(fg="#eceee8", ink="#0d0f0d", acc="#cfeb58", bone="#eceee8"),
    ("women", "light"): dict(fg="#231a22", ink="#231a22", acc="#f29a76", bone="#f3eff1"),
    ("women", "dark"): dict(fg="#f3edf0", ink="#171116", acc="#f5a07d", bone="#f3edf0"),
}


def inner(svg_text: str) -> str:
    return re.search(r"<svg[^>]*>(.*)</svg>", svg_text, flags=re.S).group(1)


def disc_behind(cx, cy, r, mode, p):
    """The accent disc behind the first letters. Light letters on a solid accent disc lose contrast, so dark mode gets a ring."""
    if mode == "light":
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{p["acc"]}"/>'
    return f'<circle cx="{cx}" cy="{cy}" r="{r - 8}" fill="none" stroke="{p["acc"]}" stroke-width="16"/>'


def atelier(gender: str, mode: str, p: dict) -> None:
    body = inner((BRAND / f"jabali-atelier-{gender}-{mode}.svg").read_text(encoding="utf8"))
    fg, acc = p["fg"], p["acc"]
    shapes_behind = disc_behind(56, 58, 100, mode, p)
    shapes_front = (
        # a solid triangle floating above the L and I
        f'<path d="M596 -6L650 -90L704 -6Z" fill="{fg}"/>'
        # a half disc under the tag, flat side up
        f'<path d="M500 228A70 70 0 0 0 640 228Z" fill="{acc}"/>'
    )
    (BRAND / f"jabali-atelier-geo-{gender}-{mode}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -104 780 408" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>{shapes_behind}{body}{shapes_front}</svg>\n',
        encoding="utf8",
    )


def mark(gender: str, mode: str, p: dict) -> None:
    body = inner((BRAND / f"jabali-mark-{gender}-{mode}.svg").read_text(encoding="utf8"))
    ink, bone = p["ink"], p["bone"]
    shapes = (
        f'<circle cx="790" cy="215" r="128" fill="{bone}"/>'
        f'<path d="M1000 668A332 332 0 0 0 668 1000L1000 1000Z" fill="{ink}"/>'
    )
    # shapes go over the tile and under the j
    marker = "<g mask="
    assert marker in body
    body = body.replace(marker, shapes + marker, 1)
    (BRAND / f"jabali-mark-geo-{gender}-{mode}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-label="Jabali"><title>Jabali</title>{body}</svg>\n',
        encoding="utf8",
    )


def sassy(gender: str, mode: str, p: dict) -> None:
    body = inner((BRAND / f"jabali-sassy-{gender}-{mode}.svg").read_text(encoding="utf8"))
    fg, acc = p["fg"], p["acc"]
    behind = disc_behind(34, -38, 104, mode, p)
    front = (
        # a half disc under the middle letters, flat side up
        f'<path d="M140 74A56 56 0 0 0 252 74Z" fill="{fg}"/>'
        # a small triangle at the bottom-left, echoing the angled pill
        f'<path d="M-44 112L-6 112L-25 70Z" fill="{acc}"/>'
    )
    (BRAND / f"jabali-sassy-geo-{gender}-{mode}.svg").write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-76 -218 650 360" role="img" aria-label="Jabali Atelier"><title>Jabali Atelier</title>{behind}{body}{front}</svg>\n',
        encoding="utf8",
    )


for (gender, mode), pal in PALETTES.items():
    atelier(gender, mode, pal)
    sassy(gender, mode, pal)
    mark(gender, mode, pal)
print("wrote geo variants for men and women, light and dark")
