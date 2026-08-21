// ============================================================
// LINE VIDEOS — drop a URL per line and the video appears on
// that line's page; leave "" and an "in production" film frame
// shows instead. HOME_VIDEO does the same for the homepage.
// Accepts YouTube/Vimeo links (rendered as embeds) or direct
// .mp4/.webm URLs (rendered as a native player).
// Sam: this is YOUR file to fill — one line per video, nothing
// else to wire.
// ============================================================

export const HOME_VIDEO = "";

export const LINE_VIDEOS: Record<string, string> = {
  "Logical": "",
  "Mathematical": "",
  "Spatial": "",
  "Linguistic": "",
  "Musical": "",
  "Bodily-Kinesthetic": "",
  "Naturalist": "",
  "Interpersonal": "",
  "Intrapersonal": "",
  "Existential": "",
  "Moral": "",
  "Aesthetic": "",
  "Emotional": "",
  "Meta-Cognitive": "",
  "Volitional": "",
  "Adversarial": "",
  "Interoceptive": "",
  "Strategic": "",
  "Systemic": "",
  "Entrepreneurial": "",
  "Creative": "",
  "Rhetorical": "",
  "Leadership": "",
  "Mechanical": "",
  "Pattern-Recognition": "",
  "Social-Perceptual": "",
  "Financial": "",
  "Humor": "",
  "Parenting": "",
  "Seduction": "",
  "Community-Founding": "",
  "Street Smarts": "",
};

/** YouTube/Vimeo URL → embeddable URL; direct media URLs pass through. */
export function toEmbed(url: string): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return { kind: "iframe", src: `https://player.vimeo.com/video/${vim[1]}` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "video", src: url };
  return { kind: "iframe", src: url };
}
