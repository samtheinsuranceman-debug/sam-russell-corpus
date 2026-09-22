import { RELEASE_POSTURE } from "@/lib/releasePolicy";

/**
 * Shown on every page of a preview deployment. A preview is the public
 * wellness edition made reachable for review before the operator has
 * completed the production attestations; it is not a launch.
 */
export default function PreviewPostureBanner() {
  if (RELEASE_POSTURE !== "preview") return null;
  return (
    <div role="status" className="fixed bottom-0 inset-x-0 z-[60] border-t border-amber-400/40 bg-amber-500/15 backdrop-blur px-4 py-2 text-center text-xs text-amber-100">
      Preview build for review. Not yet launched: use it to look around, not to keep anything you would miss. Nothing here is medical, legal or financial advice.
    </div>
  );
}
