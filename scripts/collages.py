"""Collage de cada combinación a partir de las fotos sin fondo de sus prendas (sin gastar créditos).

Uso:
  python3 scripts/collages.py                          # usa datos/ejemplo.json
  python3 scripts/collages.py datos/mi-armario.json    # tu armario
  python3 scripts/collages.py datos/mi-armario.json 03 07   # solo esas combinaciones

Necesita Python 3 con Pillow (pip3 install pillow).
Cada prenda debe tener en "foto" una imagen SIN FONDO (PNG o WebP con transparencia) dentro de public/.
Escribe public/<carpeta de la primera foto>/../outfits/<id>.jpg, o la ruta que diga "collage" en cada combinación.
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLICO = os.path.join(RAIZ, "public")
W, H = 1000, 1500  # 2:3, la proporción de las tarjetas de Vestir


def cargar(ruta_publica):
    if not ruta_publica or not ruta_publica.startswith("/"):
        return None
    f = os.path.join(PUBLICO, ruta_publica.lstrip("/"))
    if not os.path.exists(f):
        return None
    im = Image.open(f).convert("RGBA")
    im.putalpha(im.getchannel("A").point(lambda v: 0 if v < 24 else v))
    caja = im.getbbox()
    return im.crop(caja) if caja else im


def encajar(im, w, h):
    im = im.copy()
    im.thumbnail((w, h), Image.LANCZOS)
    return im


def sombra(im, blur=18, alpha=60):
    sh = Image.new("RGBA", (im.width + blur * 4, im.height + blur * 4), (0, 0, 0, 0))
    sh.paste((30, 30, 30, alpha), (blur * 2, blur * 2 + 10), im.getchannel("A"))
    return sh.filter(ImageFilter.GaussianBlur(blur))


def fuente(size, negrita=False):
    for f in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Helvetica.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if negrita else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf"):
        try:
            return ImageFont.truetype(f, size, index=1 if (negrita and f.endswith(".ttc")) else 0)
        except Exception:
            continue
    return ImageFont.load_default()


def collage(o, prendas, destino):
    por_id = {p["id"]: p for p in prendas}
    ids = [i for i in o["prendas"] if i in por_id]
    de = lambda t: [i for i in ids if por_id[i]["tipo"] == t]
    top, capa, pant, zap = de("top"), de("capa"), de("pant"), de("zapato")
    if len(top) > 1 and not capa:  # una camisa encima de una playera hace de capa
        capa, top = [top[1]], [top[0]]
    if not zap:  # si la combinación no dice zapatos, se pone el primero del armario
        zap = [p["id"] for p in prendas if p["tipo"] == "zapato" and p.get("activa", True)][:1]

    zonas = {}
    if capa:
        zonas[capa[0]] = (40, 110, 540, 800)
        if top:
            zonas[top[0]] = (600, 110, 360, 420)
        if pant:
            zonas[pant[0]] = (600, 560, 360, 740)
        if zap:
            zonas[zap[0]] = (80, 1010, 460, 260)
    else:
        if top:
            zonas[top[0]] = (50, 110, 520, 600)
        if pant:
            zonas[pant[0]] = (590, 110, 370, 1100)
        if zap:
            zonas[zap[0]] = (70, 820, 480, 300)

    c = Image.new("RGBA", (W, H), (250, 249, 246, 255))
    faltan = []
    for pid, (x, y, w, h) in zonas.items():
        im = cargar(por_id[pid].get("foto"))
        if im is None:
            faltan.append(pid)
            continue
        im = encajar(im, w, h)
        px, py = x + (w - im.width) // 2, y + (h - im.height) // 2
        c.alpha_composite(sombra(im), (px - 36, py - 36))
        c.alpha_composite(im, (px, py))

    d = ImageDraw.Draw(c)
    d.rectangle((0, 1360, W, H), fill=(255, 255, 255, 255))
    d.line((60, 1360, W - 60, 1360), fill=(228, 226, 220, 255), width=2)
    d.text((60, 1386), o["id"], font=fuente(30, True), fill=(26, 26, 26, 255))
    d.text((120, 1388), o["nombre"].upper(), font=fuente(26, True), fill=(26, 26, 26, 255))
    detalle = " · ".join(por_id[i]["nombre"] for i in ids + [z for z in zap if z not in ids])
    lineas, actual = [], ""
    for palabra in detalle.split(" "):
        if len(actual) + len(palabra) + 1 > 82:
            lineas.append(actual)
            actual = palabra
        else:
            actual = f"{actual} {palabra}".strip()
    lineas.append(actual)
    for k, linea in enumerate(lineas[:2]):
        d.text((60, 1432 + k * 28), linea, font=fuente(20), fill=(110, 110, 105, 255))
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    c.convert("RGB").save(destino, quality=84, optimize=True, progressive=True)
    return faltan


def main():
    args = sys.argv[1:]
    archivo = args[0] if args and args[0].endswith(".json") else os.path.join(RAIZ, "datos", "ejemplo.json")
    solo = [a for a in args if not a.endswith(".json")]
    datos = json.load(open(archivo, encoding="utf-8"))
    prendas = datos.get("prendas", [])
    for o in datos.get("outfits", []):
        if solo and o["id"] not in solo:
            continue
        ruta = o.get("collage") or f"/outfits/{o['id']}.jpg"
        faltan = collage(o, prendas, os.path.join(PUBLICO, ruta.lstrip("/")))
        print(o["id"], ruta, ("faltan fotos: " + ", ".join(faltan)) if faltan else "")


if __name__ == "__main__":
    main()
