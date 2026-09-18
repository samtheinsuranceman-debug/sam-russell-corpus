#!/usr/bin/env python3
"""Build the single-file public homepage from its template.

Injects the six WebP images from ../client/public as data URIs plus the
booking link and advisor email, and writes the result to <repo>/docs/mirror/index.html
(served by GitHub Pages) so there is exactly one built copy in the repo.

    python3 live/build_live_homepage.py            # writes ../../docs/mirror/index.html
    python3 live/build_live_homepage.py out.html   # writes somewhere else
"""
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent          # russell-capital-systems/live
APP = HERE.parent                                        # russell-capital-systems
REPO = APP.parent                                        # repo root
PUB = APP / "client" / "public"
DEFAULT_OUT = REPO / "docs" / "mirror" / "index.html"  # docs/index.html itself forwards the bare domain to www

IMAGES = {
    "__IMG_NEON_A__": "rcs-neon-a.webp",
    "__IMG_NEON_B__": "rcs-neon-b.webp",
    "__IMG_NEON_A_TALL__": "rcs-neon-a-tall.webp",
    "__IMG_NEON_B_TALL__": "rcs-neon-b-tall.webp",
    "__IMG_EMERALD__": "rcs-city-emerald.webp",
    "__IMG_BRIDGE__": "rcs-city-bridge.webp",
    "__IMG_CANYON__": "rcs-city-canyon.webp",
    "__IMG_INTERCHANGE__": "rcs-city-interchange.webp",
    "__IMG_HORIZON__": "rcs-city-horizon.webp",
    "__IMG_SKYWAY__": "rcs-city-skyway.webp",
    "__IMG_FLAGSHIP__": "rcs-city-flagship.webp",
    "__IMG_EXPRESSWAY__": "rcs-city-expressway.webp",
    "__IMG_GLASS__": "rcs-city-glass.webp",
    "__IMG_RIVER__": "rcs-city-river.webp",  # the wet night city under the patent plaques
    "__IMG_HARBOR__": "rcs-city-harbor.webp",
    "__IMG_SPIRE__": "rcs-city-spire.webp",
    "__IMG_LATTICE__": "rcs-city-lattice.webp",
    "__IMG_PINNACLE__": "rcs-city-pinnacle.webp",
    # The four cities cut from the designer's concept frames, every word removed.
    "__IMG_TRAILS__": "rcs-city-trails.webp",
    "__IMG_LOOPS__": "rcs-city-loops.webp",
    "__IMG_GRID__": "rcs-city-grid.webp",
    "__IMG_DUSK__": "rcs-city-dusk.webp",
    # Four cities made new in the same palette so nearly every technology has its own picture.
    "__IMG_RAIN__": "rcs-city-rain.webp",
    "__IMG_ROOFTOP__": "rcs-city-rooftop.webp",
    "__IMG_BRIDGEWAY__": "rcs-city-bridgeway.webp",
    "__IMG_MARINA__": "rcs-city-marina.webp",
    "__IMG_RAIL__": "rcs-city-rail.webp",
    "__IMG_LAKE__": "rcs-city-lake.webp",
    "__IMG_TUNNEL__": "rcs-city-tunnel.webp",
    "__IMG_OVERLOOK__": "rcs-city-overlook.webp",
    "__IMG_SKYBRIDGE__": "rcs-city-skybridge.webp",
    "__IMG_STATION__": "rcs-city-station.webp",
    "__IMG_RUNWAY__": "rcs-city-runway.webp",
}
CONSTS = {
    "__CALENDLY__": "https://calendly.com/sam-russellcapitalsystems/30min",
    "__ADVISOR_EMAIL__": "samtheinsuranceman@gmail.com",
    # The app host serves the founder's message in the owner's cloned voice; the static page embeds the player.
    "__APP_ORIGIN__": "https://www.russellcapitalsystems.com",
}
MANIFESTO = APP / "shared" / "homeManifesto.json"


def build() -> str:
    html = (HERE / "rcs-live-homepage.template.html").read_text()
    manifesto = MANIFESTO.read_text().strip()
    assert "__MANIFESTO_JSON__" in html, "placeholder missing: __MANIFESTO_JSON__"
    html = html.replace("__MANIFESTO_JSON__", manifesto.replace("</", "<\\/"))
    for key, name in IMAGES.items():
        if key not in html:
            continue  # not every picture is on the page any more; embed only what the template uses
        data = (PUB / name).read_bytes()
        uri = "data:image/webp;base64," + base64.b64encode(data).decode()
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
