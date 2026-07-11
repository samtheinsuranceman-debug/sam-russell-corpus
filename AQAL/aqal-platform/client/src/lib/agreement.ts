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

// One pending action, run by the modal once the user clicks Accept.
let pendingAction: (() => void) | null = null;
export function consumePendingAction(): (() => void) | null {
  const a = pendingAction;
  pendingAction = null;
  return a;
}

// Run `action`, but require the user agreement first. If already accepted, run
// it now; otherwise stash it and open the global agreement modal, which runs it
// after Accept. Used for every credential-entry path (free or paid).
export function requireAgreement(action: () => void) {
  if (hasAcceptedAgreement()) {
    action();
    return;
  }
  pendingAction = action;
  window.dispatchEvent(new CustomEvent(REQUIRE_AGREEMENT_EVENT));
}

// Proceed to the login/OAuth flow (where credentials are entered), gated by the
// agreement.
export function beginAuth() {
  requireAgreement(() => {
    window.location.href = getLoginUrl();
  });
}
