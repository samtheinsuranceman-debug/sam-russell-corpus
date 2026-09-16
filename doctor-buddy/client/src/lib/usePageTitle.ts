import { useEffect } from "react";

export const SITE_TITLE = "Doctor Buddy";

/** Sets the document title for a page and restores the site title on unmount. */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${SITE_TITLE}` : `${SITE_TITLE} — Adaptive Wellness Support`;
    return () => { document.title = previous; };
  }, [title]);
}
