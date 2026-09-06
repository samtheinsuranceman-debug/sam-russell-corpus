// The business name, address, phone and hours exactly as the host published
// them (Local SEO: the same NAP in the footer, the structured data and the
// Google Business Profile). Renders nothing beyond the name until they are set.
import { trpc } from "@/lib/trpc";

export function SiteIdentity({ className = "mt-1 text-xs text-[#5a7a9b]" }: { className?: string }) {
  const site = trpc.siteHealth.site.useQuery(undefined, { staleTime: 30 * 60_000, refetchOnWindowFocus: false, retry: false });
  const s = site.data;
  if (!s || (!s.phone && !s.street && !s.hours)) return null;
  const address = [s.street, [s.city, s.region].filter(Boolean).join(", "), s.postalCode].filter(Boolean).join(" · ");
  return (
    <address className={`${className} not-italic`}>
      {address && <span>{address}</span>}
      {s.phone && <span>{address ? " · " : ""}<a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`} className="hover:text-white">{s.phone}</a></span>}
      {s.hours && <span> · {s.hours}</span>}
      {s.googleBusinessProfile && <span> · <a href={s.googleBusinessProfile} target="_blank" rel="noreferrer" className="hover:text-white">Google Business Profile</a></span>}
    </address>
  );
}
