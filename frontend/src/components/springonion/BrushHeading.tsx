import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from './Reveal';

interface Props {
  level?: 1 | 2 | 3;
  children: ReactNode;
  /** Optional Marathi accent line under the heading (rendered in Devanagari). */
  accent?: string;
  accentLabel?: string;
  className?: string;
  align?: 'left' | 'center';
  id?: string;
}

const SIZE = { 1: 'text-5xl sm:text-6xl md:text-7xl', 2: 'text-4xl sm:text-5xl', 3: 'text-3xl sm:text-4xl' };

/** Brush-calligraphy display heading with a sumi stroke that draws in under it once. */
export function BrushHeading({ level = 2, children, accent, accentLabel, className, align = 'left', id }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <div ref={ref} className={cn(inView && 'is-visible', align === 'center' && 'text-center', className)}>
      <Tag id={id} className={cn('font-display leading-[1.05] text-ink', SIZE[level])}>{children}</Tag>
      <svg
        className={cn('brush-stroke mt-1 h-3 w-40 text-negi', align === 'center' && 'mx-auto')}
        viewBox="0 0 300 20"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 14 C 60 4, 120 18, 180 9 S 270 6, 296 11" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
      {accent && (
        <p lang="mr" className="mt-2 font-deva text-lg text-muted-foreground" aria-label={accentLabel}>
          {accent}
        </p>
      )}
    </div>
  );
}
