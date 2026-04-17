import { useEffect, useRef, useState, ReactNode } from "react";

interface LazyMountProps {
  children: ReactNode;
  /** Distance from viewport to start mounting (default: 200px) */
  rootMargin?: string;
  /** Min height placeholder to prevent CLS while unmounted */
  minHeight?: number | string;
  /** Mount immediately (skip observer) */
  eager?: boolean;
}

/**
 * Defers mounting children until the placeholder enters the viewport.
 * Useful for below-the-fold sections to improve initial page load.
 */
const LazyMount = ({ children, rootMargin = "200px", minHeight = 300, eager = false }: LazyMountProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(eager);

  useEffect(() => {
    if (shouldMount) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldMount(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldMount(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMount, rootMargin]);

  if (shouldMount) return <>{children}</>;

  return (
    <div
      ref={ref}
      style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      aria-hidden="true"
    />
  );
};

export default LazyMount;
