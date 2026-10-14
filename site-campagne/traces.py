"""Bords déchirés et traits de feutre, en variables CSS.
Graines fixes : la même main maladroite à chaque régénération.
Relancer avec :  python3 traces.py > assets/css/traces.css"""
import random
from urllib.parse import quote

def uri(svg): return 'url("data:image/svg+xml,' + quote(svg, safe="") + '")'

def bord(graine, largeur=1200, hauteur=26, pas=22):
    r = random.Random(graine); pts, x = [], 0.0
    while x < largeur:
        pts.append((x, hauteur * r.uniform(0.12, 1.0))); x += pas * r.uniform(0.55, 1.6)
    pts.append((largeur, hauteur * r.uniform(0.25, 0.8)))
    d = f"M0,{hauteur} L0,{pts[0][1]:.1f}"
    for i in range(1, len(pts)):
        (x0, y0), (x1, y1) = pts[i-1], pts[i]
        d += f" Q{(x0+x1)/2:.1f},{y0+(y1-y0)*r.uniform(-.45,.45):.1f} {x1:.1f},{y1:.1f}"
    return d + f" L{largeur},{hauteur} Z"

def masque(graine, retourne=False):
    t = " transform='scale(1,-1) translate(0,-26)'" if retourne else ""
    return uri(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 26' "
               f"preserveAspectRatio='none'><path d='{bord(graine)}' fill='#000'{t}/></svg>")

def coup(r, largeur, y, amp, n):
    d = f"M{r.uniform(2,8):.1f},{y+r.uniform(-amp,amp):.1f}"
    for i in range(1, n + 1):
        x = 6 + (largeur - 12) * i / n
        d += (f" C{x-largeur/(n*1.7):.1f},{y+r.uniform(-amp,amp):.1f}"
              f" {x-largeur/(n*3.4):.1f},{y+r.uniform(-amp,amp):.1f}"
              f" {x+r.uniform(-4,4):.1f},{y+r.uniform(-amp,amp):.1f}")
    return d

def trait(graine, couleur="#000", largeur=200, hauteur=16):
    """Deux passages superposés : le trait qu'on repasse."""
    r = random.Random(graine)
    a = coup(r, largeur, hauteur * .55, hauteur * .19, 6)
    b = coup(r, largeur, hauteur * .62, hauteur * .15, 5)
    return uri(
        f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {largeur} {hauteur}' "
        f"preserveAspectRatio='none'>"
        f"<path d='{a}' fill='none' stroke='{couleur}' stroke-width='{hauteur*.26:.1f}' stroke-linecap='round'/>"
        f"<path d='{b}' fill='none' stroke='{couleur}' stroke-width='{hauteur*.15:.1f}' stroke-linecap='round' opacity='.75'/>"
        f"</svg>")

print("/* Généré par traces.py — ne pas modifier à la main. */")
print(":root {")
for i in (1, 2, 3, 4):
    print(f"  --dechirure-haut-{i}: {masque(i)};")
    print(f"  --dechirure-bas-{i}: {masque(i + 40, retourne=True)};")
for i in (1, 2, 3, 4, 5, 6):
    print(f"  --trait-{i}: {trait(i * 7)};")
# Sur le pied bleu, le trait doit être blanc : une couleur ne se change pas
# dans une URI de données, il faut donc une seconde version.
print(f"  --trait-blanc: {trait(28, '#ffffff')};")
print(f"  --trait-blanc-2: {trait(42, '#ffffff')};")
print("}")
