#!/usr/bin/env python3
"""Rebuild rcs-live-homepage.html from its template.

Injects the six WebP images from ../client/public as data URIs plus the
booking link and advisor email. Run from anywhere:

    python3 live/build_live_homepage.py
"""
import base64, pathlib

HERE = pathlib.Path(__file__).resolve().parent
PUB = HERE.parent / "client" / "public"
IMAGES = {
    "__IMG_NEON_A__": "rcs-neon-a.webp",
    "__IMG_NEON_B__": "rcs-neon-b.webp",
    "__IMG_EMERALD__": "rcs-city-emerald.webp",
    "__IMG_BRIDGE__": "rcs-city-bridge.webp",
    "__IMG_CANYON__": "rcs-city-canyon.webp",
    "__IMG_INTERCHANGE__": "rcs-city-interchange.webp",
}
CONSTS = {
    "__CALENDLY__": "https://calendly.com/samtheinsuranceman-1/30min",
    "__ADVISOR_EMAIL__": "samtheinsuranceman@gmail.com",
}

html = (HERE / "rcs-live-homepage.template.html").read_text()
for key, name in IMAGES.items():
    data = (PUB / name).read_bytes()
    uri = "data:image/webp;base64," + base64.b64encode(data).decode()
    assert key in html, f"placeholder missing: {key}"
    html = html.replace(key, uri)
for key, val in CONSTS.items():
    html = html.replace(key, val)
leftover = [k for k in list(IMAGES) + list(CONSTS) if k in html]
assert not leftover, leftover
out = HERE / "rcs-live-homepage.html"
out.write_text(html)
print(f"wrote {out} ({out.stat().st_size:,} bytes)")
