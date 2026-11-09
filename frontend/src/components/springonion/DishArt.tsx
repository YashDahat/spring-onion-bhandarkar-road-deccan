import type { Cuisine } from '@/types/restaurant';
import { CUISINE_LABEL } from '@/lib/format';
import { cn } from '@/lib/utils';

const WASH: Record<string, string> = {
  CHINESE: 'from-[hsl(0_60%_92%)] to-[hsl(36_60%_90%)] dark:from-[hsl(0_30%_18%)] dark:to-[hsl(36_30%_16%)]',
  INDO_CHINESE: 'from-[hsl(20_70%_90%)] to-[hsl(0_50%_92%)] dark:from-[hsl(20_30%_18%)] dark:to-[hsl(0_25%_16%)]',
  THAI: 'from-[hsl(108_30%_88%)] to-[hsl(60_50%_90%)] dark:from-[hsl(108_20%_16%)] dark:to-[hsl(60_20%_15%)]',
  JAPANESE: 'from-[hsl(220_30%_92%)] to-[hsl(0_0%_95%)] dark:from-[hsl(220_20%_18%)] dark:to-[hsl(0_0%_14%)]',
  PAN_ASIAN: 'from-[hsl(36_70%_88%)] to-[hsl(108_25%_90%)] dark:from-[hsl(36_30%_17%)] dark:to-[hsl(108_15%_15%)]',
  DESSERT: 'from-[hsl(30_60%_92%)] to-[hsl(340_40%_93%)] dark:from-[hsl(30_25%_18%)] dark:to-[hsl(340_20%_17%)]',
  BEVERAGE: 'from-[hsl(190_40%_90%)] to-[hsl(108_25%_92%)] dark:from-[hsl(190_20%_16%)] dark:to-[hsl(108_15%_15%)]',
};

/**
 * The dish photo when the admin has uploaded one; otherwise an honest ink-wash tile (brush initial + cuisine),
 * never a misleading stock photo.
 */
export function DishArt({ name, cuisine, imageUrl, className }: { name: string; cuisine: Cuisine | string; imageUrl?: string | null; className?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} loading="lazy" decoding="async" className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div aria-hidden="true" className={cn('relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br', WASH[cuisine] ?? WASH.CHINESE, className)}>
      <span className="font-display text-6xl text-ink/70">{name.charAt(0)}</span>
      <span className="absolute bottom-2 right-3 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-ink/60">{CUISINE_LABEL[cuisine] ?? cuisine}</span>
      <svg className="absolute -left-4 top-3 h-10 w-28 text-negi/30" viewBox="0 0 120 40"><path d="M2 30 C 30 5, 70 35, 118 8" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>
    </div>
  );
}
