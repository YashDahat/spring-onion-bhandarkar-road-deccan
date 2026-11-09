import { useEffect, useRef, useState, type ElementType, type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/** Shared hook: true once the element has scrolled into view (or immediately without IntersectionObserver). */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

interface RevealProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Extra class that drives a nested signature effect (e.g. "stamp-press"). */
  effect?: string;
  delayMs?: number;
  id?: string;
  style?: CSSProperties;
}

/**
 * Settles content into view once, with transform/opacity only. With reduced motion (or no JS) everything is
 * simply visible — the hiding rule lives in index.css behind prefers-reduced-motion: no-preference.
 */
export function Reveal({ as: Tag = 'div', className, children, effect, delayMs = 0, id, style }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      id={id}
      className={cn('reveal', effect, inView && 'is-visible', className)}
      style={{ ...style, transitionDelay: delayMs ? `${delayMs}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
