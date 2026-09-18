import { useEffect, useRef } from "react";

/**
 * Hook that applies parallax depth to elements with [data-parallax] attribute.
 * Elements move at different speeds based on their data-parallax value (0.0 - 1.0).
 * 0 = fixed, 0.5 = half speed, 1 = normal scroll speed.
 * Premium Feel 10/10: Multi-layer scroll depth.
 */
export function useParallax() {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const elements = document.querySelectorAll<HTMLElement>("[data-parallax]");
          
          elements.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax || "0.5");
            const offset = scrollY * (1 - speed);
            el.style.transform = `translate3d(0, ${offset}px, 0)`;
          });
          
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
