import { useEffect } from "react";

/**
 * Skip-to-content link for keyboard users
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#22c55e] focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

/**
 * Focus visible ring styles applied globally
 */
export function FocusRingStyles() {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    const style = document.createElement("style");
    style.textContent = `
      :focus-visible {
        outline: 2px solid #22c55e;
        outline-offset: 2px;
        border-radius: 4px;
      }
      
      /* Reduce motion for users who prefer it */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* High contrast mode improvements */
      @media (prefers-contrast: high) {
        .rc-card {
          border-width: 2px;
        }
        .rc-btn {
          border-width: 2px;
        }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return null;
}

/**
 * ARIA live region for screen reader announcements
 */
export function LiveRegion({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
