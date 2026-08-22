// ============================================================
// PAGE VIDEOS — Sam's per-page video map for the whole site.
// Key = exact page path, value = video URL (YouTube, Vimeo, or
// direct .mp4/.webm — anything lineVideos.toEmbed understands).
// The <PageVideo /> component (mounted on every detail-page
// family) looks up the current path here: configured pages show
// the player, everything else shows the slim "in production"
// slot. TO ADD A VIDEO: paste one line — no other change needed.
// Line pages (/line/:slug) keep their own map in lineVideos.ts.
// ============================================================

export const PAGE_VIDEOS: Record<string, string> = {
  // Examples of every supported family — paste real URLs to go live:
  // "/protocol/emdr": "https://youtu.be/XXXXXXXX",
  // "/myth/laetrile": "https://vimeo.com/XXXXXXXX",
  // "/capacity/adaptive": "https://www.joinaqal.com/media/adaptive.mp4",
  // "/kind/psychotherapy": "",
  // "/wing/miracle-cure": "",
  // "/verdict/harmful": "",
  // "/pair/logical--strategic": "",
  // "/practice/sleep": "",
  // "/goal/focus": "",
  // "/build/adaptive/emdr": "",
  // "/compare/emdr--vs--mbsr": "",
};
