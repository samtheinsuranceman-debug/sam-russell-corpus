/**
 * Device, OS and browser read from a stored user-agent string.
 *
 * Used wherever the platform reports what visitors used to reach it, so that
 * those figures come from recorded sessions and never from a guess.
 */
export interface UserAgentSummary {
  device: "Desktop" | "Mobile" | "Tablet" | "Unknown";
  os: string;
  browser: string;
}

export function describeUserAgent(ua: string | null | undefined): UserAgentSummary {
  if (!ua) return { device: "Unknown", os: "Unknown OS", browser: "Unknown browser" };
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iOS/i.test(ua)
      ? "iOS"
      : /Mac OS X|Macintosh/i.test(ua)
        ? "macOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Other OS";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Firefox\//i.test(ua)
          ? "Firefox"
          : /Safari\//i.test(ua)
            ? "Safari"
            : "Other browser";
  return { device, os, browser };
}
