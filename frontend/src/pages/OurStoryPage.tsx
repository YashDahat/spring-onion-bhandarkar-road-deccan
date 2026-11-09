import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStory } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { Reveal } from '@/components/springonion/Reveal';
import { StickyActions } from '@/components/springonion/StickyActions';
import { usePageMeta } from '@/lib/usePageMeta';
import { cn } from '@/lib/utils';

export default function OurStoryPage() {
  usePageMeta('Our story', 'The story of Spring Onion: no Ajinomoto, thirty-odd house sauces, and a cosy kitchen on Bhandarkar Road, Deccan.');
  const { data: chapters, isLoading } = useStory();
  const listRef = useRef<HTMLOListElement | null>(null);
  const [fill, setFill] = useState(0);

  // The ink line fills as the reader moves through the chapters (rAF-throttled, transform only).
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = listRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const progress = (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height);
        setFill(Math.max(0, Math.min(1, progress)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [chapters]);

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-10">
        <p className="section-no mb-4">Our story</p>
        <BrushHeading level={1} accent="आमची गोष्ट" accentLabel="Our story">The wok, the sauces, the street</BrushHeading>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">How a small kitchen on Bhandarkar Road earned its regulars — one clean, bright plate at a time.</p>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-24">
        {isLoading && <div className="space-y-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>}
        {!isLoading && (chapters ?? []).length === 0 && <p className="text-muted-foreground">Our story is being written — check back soon.</p>}
        <ol ref={listRef} className="relative">
          <span className="absolute left-[1.1rem] top-2 h-[calc(100%-1rem)] w-0.5 bg-border md:left-1/2" aria-hidden="true" />
          <span className="timeline-fill absolute left-[1.1rem] top-2 h-[calc(100%-1rem)] w-0.5 bg-negi md:left-1/2" style={{ ['--fill' as string]: fill }} aria-hidden="true" />
          {(chapters ?? []).map((c, i) => {
            const right = i % 2 === 1;
            return (
              <li key={c.id} className="relative mb-14 pl-12 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                <span className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-negi bg-background text-xs font-bold text-negi md:left-1/2 md:-translate-x-1/2" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Reveal className={cn(right ? 'md:col-start-2' : 'md:col-start-1 md:text-right')}>
                  {c.eyebrow && <p className="section-no">{c.eyebrow}</p>}
                  <h2 className="mt-2 font-display text-4xl">{c.title}</h2>
                  <p className="mt-3 text-muted-foreground">{c.body}</p>
                  {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className={cn('mt-4 aspect-[4/3] w-full rounded-lg object-cover', right ? 'md:translate-x-6' : 'md:-translate-x-6')} />}
                </Reveal>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 rounded-lg border bg-card p-8 text-center">
          <p className="font-display text-4xl">Hungry yet?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="tap font-bold"><Link to="/order">Order now</Link></Button>
            <Button asChild size="lg" variant="outline" className="tap"><Link to="/book">Book a table</Link></Button>
          </div>
        </div>
      </div>
      <StickyActions />
    </div>
  );
}
