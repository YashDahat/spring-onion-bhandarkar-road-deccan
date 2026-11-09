import { Flame } from 'lucide-react';
import type { DietType } from '@/types/restaurant';
import { SPICE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';

const DIET_LABEL: Record<DietType, string> = { VEG: 'Vegetarian', EGG: 'Contains egg', NON_VEG: 'Non-vegetarian' };

/** FSSAI-style marker: green dot = veg, brown triangle = non-veg, yellow dot = egg. */
export function DietMark({ diet, className }: { diet: DietType; className?: string }) {
  const colour = diet === 'VEG' ? '#1E7B34' : diet === 'EGG' ? '#B7791F' : '#7B3F00';
  return (
    <span
      role="img"
      aria-label={DIET_LABEL[diet]}
      title={DIET_LABEL[diet]}
      className={cn('inline-flex h-4 w-4 shrink-0 items-center justify-center border-2 bg-white', className)}
      style={{ borderColor: colour }}
    >
      {diet === 'NON_VEG' ? (
        <svg viewBox="0 0 10 10" className="h-2 w-2" aria-hidden="true"><path d="M5 1 L9 9 L1 9 Z" fill={colour} /></svg>
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ background: colour }} />
      )}
    </span>
  );
}

export function SpiceMeter({ level, className }: { level: number; className?: string }) {
  if (level <= 0) return <span className={cn('text-xs text-muted-foreground', className)}>Mild</span>;
  return (
    <span role="img" aria-label={`Spice: ${SPICE_LABEL[level] ?? 'Hot'}`} className={cn('inline-flex items-center gap-0.5 text-primary', className)}>
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3.5 w-3.5" aria-hidden="true" />
      ))}
    </span>
  );
}

export { DIET_LABEL };
