import { cn } from '@/lib/utils';

interface Props {
  label: string;
  tone?: 'vermilion' | 'negi' | 'saffron';
  shape?: 'round' | 'square';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Faded outline for a not-yet-earned stamp. */
  empty?: boolean;
}

const TONE = {
  vermilion: 'border-primary text-primary',
  negi: 'border-negi text-negi',
  saffron: 'border-saffron text-[hsl(30_70%_32%)] dark:text-saffron',
};
const SIZE = { sm: 'h-12 w-12 text-[0.55rem]', md: 'h-16 w-16 text-[0.65rem]', lg: 'h-24 w-24 text-xs' };

/** A hanko-style seal. Wrap a parent in <Reveal effect="stamp-press"> for the press-on animation. */
export function Hanko({ label, tone = 'vermilion', shape = 'round', size = 'md', className, empty }: Props) {
  return (
    <span
      className={cn(
        'hanko inline-flex shrink-0 select-none items-center justify-center border-[3px] p-1 text-center font-bold uppercase leading-tight tracking-wider',
        shape === 'round' ? 'rounded-full' : 'rounded-sm',
        SIZE[size],
        empty ? 'border-dashed border-border text-muted-foreground' : TONE[tone],
        !empty && '-rotate-6 bg-background/60',
        className,
      )}
    >
      {label}
    </span>
  );
}
