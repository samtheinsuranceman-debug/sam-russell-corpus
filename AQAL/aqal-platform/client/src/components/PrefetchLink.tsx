import { Link } from "wouter";
import { usePrefetch } from "@/App";
import { ReactNode, useCallback } from "react";
import { playTransition } from "@/lib/audio";

/**
 * PrefetchLink — wraps wouter's Link with:
 * - onMouseEnter/onFocus prefetching (instant navigation)
 * - onClick subtle audio transition (premium feel)
 */
export function PrefetchLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const prefetch = usePrefetch();

  const handlePrefetch = useCallback(() => {
    prefetch(href);
  }, [href, prefetch]);

  const handleClick = useCallback(() => {
    playTransition();
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
