// ============================================================
// /portal/map — the Map tab. Opens the overlay; the page itself is a quiet
// landing so the URL is real, bookmarkable, and in the manifest.
// ============================================================
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useSiteMap } from "@/contexts/SiteMapContext";

export default function SiteMapPage() {
  const map = useSiteMap();
  useEffect(() => { if (map.mode === "off") map.openMap(); }, [map]);
  return (
    <AppShell title="Map" subtitle="How this site is arranged">
      <div className="p-4 text-sm opacity-80">
        <p>The map is open above. Close it with the X in its top-right corner; pages you have visited stay green on every login.</p>
        {map.mode === "off" ? <button type="button" onClick={map.openMap} className="mt-3 rounded-full bg-amber-300 px-4 py-1.5 text-[#07130d] font-semibold">Open the map</button> : null}
      </div>
    </AppShell>
  );
}
