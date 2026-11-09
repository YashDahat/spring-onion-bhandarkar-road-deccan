import { cn } from '@/lib/utils';

/** Hero illustration: an ink-brush bowl of noodles, a rising steam line and a spring onion stalk. Decorative. */
export function InkWok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 360" className={cn('h-auto w-full', className)} aria-hidden="true" focusable="false">
      <circle cx="290" cy="90" r="56" className="fill-primary" opacity="0.9" />
      <g className="brush-stroke is-visible" fill="none" stroke="hsl(var(--ink))" strokeLinecap="round">
        <path d="M150 150 C 135 120, 170 100, 155 70 S 165 30, 180 20" strokeWidth="4" opacity="0.55" />
        <path d="M195 150 C 182 122, 214 104, 200 76 S 210 40, 222 28" strokeWidth="3" opacity="0.4" />
        <path d="M60 190 C 120 200, 280 200, 340 188" strokeWidth="9" />
        <path d="M70 196 C 85 275, 140 310, 200 312 C 262 312, 318 276, 332 196" strokeWidth="10" />
        <path d="M150 318 L 250 318" strokeWidth="7" />
        <path d="M110 182 C 150 160, 190 200, 230 172 S 300 176, 310 168" strokeWidth="4" opacity="0.7" />
        <path d="M120 186 C 160 170, 200 196, 250 178" strokeWidth="3" opacity="0.6" />
      </g>
      <g fill="none" strokeLinecap="round">
        <path d="M300 330 C 320 250, 340 180, 372 110" stroke="hsl(var(--negi))" strokeWidth="8" />
        <path d="M318 290 C 300 230, 296 190, 300 150" stroke="hsl(var(--spring))" strokeWidth="6" />
        <path d="M296 336 C 300 344, 308 346, 314 338" stroke="hsl(var(--ink))" strokeWidth="3" opacity="0.6" />
      </g>
      <path d="M70 250 C 110 262, 150 266, 200 266" stroke="hsl(var(--saffron))" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}
