#!/usr/bin/env python3
"""Build the single-file public homepage from its template.

Injects the six WebP images from ../client/public as data URIs plus the
booking link and advisor email, and writes the result to <repo>/docs/index.html
(served by GitHub Pages) so there is exactly one built copy in the repo.

    python3 live/build_live_homepage.py            # writes ../../docs/index.html
    python3 live/build_live_homepage.py out.html   # writes somewhere else
"""
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent          # russell-capital-systems/live
APP = HERE.parent                                        # russell-capital-systems
REPO = APP.parent                                        # repo root
PUB = APP / "client" / "public"
DEFAULT_OUT = REPO / "docs" / "index.html"

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


def build() -> str:
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
    return html


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build())
    print(f"wrote {out} ({out.stat().st_size:,} bytes)")
