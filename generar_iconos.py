"""Genera los iconos PNG de la PWA sin dependencias (solo stdlib).
Uso: python generar_iconos.py
"""
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).parent / "public"
GREEN = (54, 124, 43)
DARK = (30, 77, 21)
YELLOW = (255, 222, 0)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def png(size):
    rows = []
    cy = size / 2
    r_ring = size * 0.30
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            c = lerp(GREEN, DARK, (x + y) / (2 * size))
            # franja amarilla superior
            if y < size * 0.07:
                c = YELLOW
            # engranaje simplificado: aro amarillo + centro verde
            d = ((x - size / 2) ** 2 + (y - cy) ** 2) ** 0.5
            if r_ring * 0.62 < d < r_ring:
                c = YELLOW
            # 8 dientes
            elif r_ring <= d < r_ring * 1.28:
                import math
                ang = math.atan2(y - cy, x - size / 2)
                if math.cos(ang * 8) > 0.35:
                    c = YELLOW
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
