import { getLoginUrl } from "@/const";

// ============================================================
// User-agreement gate — must be accepted BEFORE any sign-in / sign-up
// (before the user enters a username or passcode), for free and paid alike.
// ============================================================

const KEY = "aqal_agreement_accepted_v1";
export const REQUIRE_AGREEMENT_EVENT = "aqal:require-agreement";

export function hasAcceptedAgreement(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setAgreementAccepted() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore storage errors */
  }
}

// Proceed to the login/OAuth flow (where credentials are entered) — but only
// after the user has accepted the agreement. If they haven't, open the global
// agreement modal instead; it proceeds here again once they click Accept.
export function beginAuth() {
  if (hasAcceptedAgreement()) {
    window.location.href = getLoginUrl();
    return;
  }
  window.dispatchEvent(new CustomEvent(REQUIRE_AGREEMENT_EVENT));
}
