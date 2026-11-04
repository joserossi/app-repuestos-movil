"""Genera los iconos PNG de la PWA sin dependencias (solo stdlib).
Fondo verde de la barra superior + cubo de "Repuestos" de app-agricola en crema.
Uso: python generar_iconos.py
"""
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).parent / "public"
BG = (0x5E, 0x78, 0x53)   # --topbar-bg
FG = (0xED, 0xE9, 0xDF)   # --topbar-hi

# Cubo (viewBox 24x24 del icono "Repuestos" de app-agricola), como segmentos
HEX = [(12, 2), (21, 7.2), (21, 16.4), (12, 22), (3, 16.4), (3, 7.2)]
SEGS = [(HEX[i], HEX[(i + 1) % 6]) for i in range(6)]
SEGS += [((3.27, 6.96), (12, 12.01)), ((12, 12.01), (20.73, 6.96)), ((12, 12.01), (12, 22.08))]

STROKE = 2.0  # grosor en unidades del viewBox
ICON_FRAC = 0.50  # fraccion del lado que ocupa el cubo


def dist_seg(px, py, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def png(size):
    scale = size * ICON_FRAC / 20.0  # el cubo mide ~20 unidades de alto
    off = size / 2 - 12 * scale      # centro del viewBox (12,12) al centro
    half = STROKE * scale / 2
    segs = [((a[0] * scale + off, a[1] * scale + off), (b[0] * scale + off, b[1] * scale + off)) for a, b in SEGS]
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            d = min(dist_seg(px, py, a, b) for a, b in segs)
            a = max(0.0, min(1.0, half + 0.5 - d))
            c = tuple(round(BG[i] + (FG[i] - BG[i]) * a) for i in range(3))
            row += bytes(c)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


for name, size in [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]:
    (OUT / name).write_bytes(png(size))
    print("ok", name)
