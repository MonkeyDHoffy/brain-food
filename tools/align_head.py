"""Setzt den Fotokopf der Spielfigur aus zwei freigestellten PNGs zusammen.

header_upper.png liegt auf einer 400x400-Fläche, lower_jaw.png ist sauberer freigestellt, liegt aber
vergrößert auf einer A4-Fläche. Das Skript sucht Maßstab und Lage des Kiefers per Abgleich mit dem
Originalfoto (gleiches Gesicht, 400x400) und schreibt beide Hälften passgenau auf eine gemeinsame Fläche.

Aufruf:  python tools/align_head.py
Ergebnis: public/char/head_upper.png, public/char/head_jaw.png, src/data/head.json, tools/head_check.png
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vorgaben" / "kopf"
OUT = ROOT / "public" / "char"
EXPORT_SCALE = 2  # Ausgabe in doppelter 400er-Auflösung, genug Reserve für 4K


def alpha_bbox(img):
    a = np.asarray(img.getchannel("A"))
    ys, xs = np.nonzero(a > 8)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    photo = np.asarray(Image.open(SRC / "original-foto.jpeg").convert("RGB"), dtype=np.float32)
    upper = Image.open(SRC / "header_upper.png").convert("RGBA")
    jaw_ref = Image.open(SRC / "jaw_lower_400.png").convert("RGBA")
    jaw_big = Image.open(SRC / "lower_jaw.png").convert("RGBA")

    jaw_crop = jaw_big.crop(alpha_bbox(jaw_big))
    rx0, ry0, rx1, ry1 = alpha_bbox(jaw_ref)
    s0 = (rx1 - rx0) / jaw_crop.width
    print(f"Grobe Lage aus jaw_lower_400: x={rx0} y={ry0} w={rx1 - rx0}, Startmaßstab {s0:.4f}")

    best = None
    for s in np.linspace(s0 * 0.85, s0 * 1.15, 31):
        w = max(1, round(jaw_crop.width * s))
        h = max(1, round(jaw_crop.height * s))
        small = jaw_crop.resize((w, h), Image.LANCZOS)
        arr = np.asarray(small, dtype=np.float32)
        rgb, a = arr[..., :3], arr[..., 3] / 255.0
        mask = a > 0.6
        if mask.sum() < 200:
            continue
        for dy in range(-14, 15):
            for dx in range(-14, 15):
                x, y = rx0 + dx, ry0 + dy
                if x < 0 or y < 0 or x + w > 400 or y + h > 400:
                    continue
                region = photo[y:y + h, x:x + w]
                err = np.mean((region[mask] - rgb[mask]) ** 2)
                if best is None or err < best[0]:
                    best = (err, s, x, y, w, h)
    err, s, x, y, w, h = best
    print(f"Beste Lage: Maßstab {s:.4f}, x={x}, y={y}, {w}x{h}, MSE {err:.1f}")

    # Gemeinsame Fläche in Exportauflösung
    E = EXPORT_SCALE
    canvas = (400 * E, 400 * E)
    upper_big = upper.resize(canvas, Image.LANCZOS)
    jaw_layer = Image.new("RGBA", canvas, (0, 0, 0, 0))
    jaw_scaled = jaw_crop.resize((round(jaw_crop.width * s * E), round(jaw_crop.height * s * E)), Image.LANCZOS)
    jaw_layer.paste(jaw_scaled, (round(x * E), round(y * E)), jaw_scaled)

    # Helle Schnittkante oben am Kiefer entfernen (graue/weiße, ungesättigte Pixel in den obersten Zeilen)
    ja_arr = np.array(jaw_layer)
    rows = np.nonzero((ja_arr[..., 3] > 128).sum(axis=1) > 0)[0]
    top = rows.min()
    band = ja_arr[top:top + 5 * E]
    rgb = band[..., :3].astype(np.int16)
    light = (rgb.min(axis=2) > 150) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 40)
    band[..., 3][light] = 0
    ja_arr[top:top + 5 * E] = band
    jaw_layer = Image.fromarray(ja_arr)

    # Auf die gemeinsame Kopf-Box zuschneiden (mit etwas Rand für Drehung)
    ux0, uy0, ux1, uy1 = alpha_bbox(upper_big)
    jx0, jy0, jx1, jy1 = alpha_bbox(jaw_layer)
    pad = 6 * E
    box = (max(0, min(ux0, jx0) - pad), max(0, min(uy0, jy0) - pad),
           min(canvas[0], max(ux1, jx1) + pad), min(canvas[1], max(uy1, jy1) + pad))
    upper_out = upper_big.crop(box)
    jaw_out = jaw_layer.crop(box)
    OUT.mkdir(parents=True, exist_ok=True)
    upper_out.save(OUT / "head_upper.png", optimize=True)
    jaw_out.save(OUT / "head_jaw.png", optimize=True)

    # Schnittkante: unterste deckende Zeile des Oberkopfs und oberste des Kiefers (in Ausgabekoordinaten)
    ua = np.asarray(upper_out.getchannel("A"))
    ja = np.asarray(jaw_out.getchannel("A"))
    upper_rows = np.nonzero((ua > 128).sum(axis=1) > 20)[0]
    jaw_rows = np.nonzero((ja > 128).sum(axis=1) > 20)[0]
    upper_cut = int(upper_rows.max())
    jaw_top = int(jaw_rows.min())

    def span(alpha, row):
        cols = np.nonzero(alpha[row] > 128)[0]
        return int(cols.min()), int(cols.max())

    meta = {
        "width": upper_out.width,
        "height": upper_out.height,
        "upperCutY": upper_cut,
        "upperCutSpan": span(ua, upper_cut - 2),
        "jawTopY": jaw_top,
        "jawTopSpan": span(ja, jaw_top + 2),
        "jawBottomY": int(jaw_rows.max()),
        "source": {"scale": round(float(s), 5), "x": int(x), "y": int(y), "box": [int(v) for v in box], "exportScale": E},
    }
    (ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "data" / "head.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # Kontrollbild: zusammengesetzt auf grauem Grund, daneben das Originalfoto im selben Ausschnitt
    check = Image.new("RGBA", (upper_out.width * 2 + 20, upper_out.height), (200, 200, 200, 255))
    comp = Image.alpha_composite(Image.alpha_composite(Image.new("RGBA", upper_out.size, (200, 200, 200, 255)), jaw_out), upper_out)
    check.paste(comp, (0, 0))
    ref = Image.open(SRC / "original-foto.jpeg").convert("RGBA").resize(canvas, Image.LANCZOS).crop(box)
    check.paste(ref, (upper_out.width + 20, 0))
    check.save(ROOT / "tools" / "head_check.png")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
