import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Heart, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/cart';
import { useAuth } from '@/context/AuthContext';
import { useToggleFavourite, useWokOptions } from '@/hooks/restaurantHooks';
import { restaurantService } from '@/services/restaurantService';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { DietMark } from '@/components/springonion/DietMark';
import { cartLine } from '@/components/springonion/DishActions';
import { formatINR, SPICE_LABEL } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import type { DietType, WokGroup, WokOptionDto } from '@/types/restaurant';
import { cn } from '@/lib/utils';

const STEPS: { group: WokGroup; title: string; hint: string }[] = [
  { group: 'BASE', title: 'Choose your base', hint: 'Noodles or rice — sets the bowl price.' },
  { group: 'PROTEIN', title: 'Pick a protein', hint: 'Veg, egg or non-veg.' },
  { group: 'SAUCE', title: 'One house sauce', hint: 'Made in our kitchen. Pick the one you’re craving.' },
  { group: 'VEGGIES', title: 'Add greens', hint: 'Optional — up to 4 add-ons in total.' },
  { group: 'FINISH', title: 'Finish it', hint: 'Optional crunch on top.' },
];
const MAX_ADDONS = 4;

export default function WokBarPage() {
  usePageMeta('Wok Bar — build your own wok', 'Build your own wok at Spring Onion, Deccan: choose noodles or rice, a protein, one of our house sauces and your spice level.');
  const { data: options, isLoading } = useWokOptions();
  const [params] = useSearchParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const toggleFav = useToggleFavourite();
  const [baseId, setBaseId] = useState<number | null>(null);
  const [proteinId, setProteinId] = useState<number | null>(null);
  const [sauceId, setSauceId] = useState<number | null>(null);
  const [addOns, setAddOns] = useState<number[]>([]);
  const [spice, setSpice] = useState(1);
  const [busy, setBusy] = useState(false);

  // Re-open a saved wok (?combo=id) — e.g. from favourites.
  useEffect(() => {
    const id = Number(params.get('combo'));
    if (!id) return;
    restaurantService.wokCombo(id).then((c) => {
      setBaseId(c.baseId); setProteinId(c.proteinId); setSauceId(c.sauceId); setAddOns(c.addOnIds); setSpice(c.spiceLevel);
    }).catch(() => undefined);
  }, [params]);

  const byGroup = useMemo(() => {
    const m = new Map<WokGroup, WokOptionDto[]>();
    (options ?? []).forEach((o) => m.set(o.groupCode, [...(m.get(o.groupCode) ?? []), o]));
    return m;
  }, [options]);
  const find = (id: number | null) => (options ?? []).find((o) => o.id === id);
  const chosen = [find(baseId), find(proteinId), find(sauceId), ...addOns.map((id) => find(id))].filter(Boolean) as WokOptionDto[];
  const price = chosen.reduce((s, o) => s + Number(o.price), 0);
  const diet: DietType = chosen.some((o) => o.diet === 'NON_VEG') ? 'NON_VEG' : chosen.some((o) => o.diet === 'EGG') ? 'EGG' : 'VEG';
  const ready = baseId != null && proteinId != null && sauceId != null;
  const doneSteps = [baseId, proteinId, sauceId].filter((x) => x != null).length;
  const missing = [baseId == null && 'a base', proteinId == null && 'a protein', sauceId == null && 'a sauce'].filter(Boolean) as string[];

  const pick = (group: WokGroup, id: number) => {
    if (group === 'BASE') setBaseId(id);
    else if (group === 'PROTEIN') setProteinId(id);
    else if (group === 'SAUCE') setSauceId(id);
    else setAddOns((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_ADDONS ? cur : [...cur, id]));
  };
  const isPicked = (group: WokGroup, id: number) =>
    group === 'BASE' ? baseId === id : group === 'PROTEIN' ? proteinId === id : group === 'SAUCE' ? sauceId === id : addOns.includes(id);

  async function build() {
    if (!ready) return null;
    setBusy(true);
    try {
      return await restaurantService.buildWok({ baseId: baseId!, proteinId: proteinId!, sauceId: sauceId!, addOnIds: addOns, spiceLevel: spice });
    } catch {
      return null; // interceptor already toasted
    } finally {
      setBusy(false);
    }
  }

  async function addToOrder() {
    const combo = await build();
    if (!combo) return;
    addItem(cartLine({ itemType: 'WOK', itemId: combo.id, name: `${combo.name} (${combo.summary})`, price: combo.price }), 1);
    toast.success('Your wok is in the order');
  }

  async function saveFavourite() {
    const combo = await build();
    if (!combo) return;
    toggleFav.mutate({ itemType: 'WOK', itemId: combo.id, name: 'Your wok' });
  }

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <p className="section-no mb-4">New at Spring Onion</p>
        <BrushHeading level={1} accent="तुमचा स्वतःचा वोक" accentLabel="Your own wok">The Wok Bar</BrushHeading>
        <p className="mt-4 max-w-2xl text-muted-foreground">Thirty-odd sauces live in our kitchen — now you choose the line-up. Build it once, save it, and reorder your wok in one tap next time.</p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-32 lg:grid-cols-[1fr_20rem]">
        <div>
          <ol className="mb-8 flex gap-2" aria-label="Progress">
            {STEPS.slice(0, 3).map((s, i) => (
              <li key={s.group} className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-negi transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${i < doneSteps ? 1 : 0})`, transformOrigin: 'left' }} />
                </div>
                <span className="mt-1 block text-xs text-muted-foreground">{s.group.charAt(0) + s.group.slice(1).toLowerCase()}</span>
              </li>
            ))}
          </ol>

          {isLoading && <Skeleton className="h-96 rounded-lg" />}
          {!isLoading && (options ?? []).length === 0 && (
            <p className="rounded-lg border bg-card p-6 text-muted-foreground">The Wok Bar is being set up — meanwhile, our <Link className="font-bold text-negi underline" to="/menu">full menu</Link> is open.</p>
          )}

          {STEPS.map((s, i) => {
            const opts = byGroup.get(s.group) ?? [];
            if (!opts.length) return null;
            const multi = s.group === 'VEGGIES' || s.group === 'FINISH';
            return (
              <fieldset key={s.group} className="mb-10">
                <legend className="mb-1 flex items-baseline gap-3">
                  <span className="section-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-3xl">{s.title}</span>
                </legend>
                <p className="mb-4 text-sm text-muted-foreground">{s.hint}{multi && ` (${addOns.length}/${MAX_ADDONS} picked)`}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {opts.map((o) => {
                    const on = isPicked(s.group, o.id);
                    const blocked = multi && !on && addOns.length >= MAX_ADDONS;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role={multi ? 'checkbox' : 'radio'}
                        aria-checked={on}
                        disabled={blocked}
                        onClick={() => pick(s.group, o.id)}
                        className={cn('press tap flex items-start gap-3 rounded-lg border-2 bg-card p-4 text-left transition-colors disabled:opacity-50',
                          on ? 'border-negi bg-secondary' : 'border-border hover:border-negi/60')}
                      >
                        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2', multi ? 'rounded-sm' : 'rounded-full', on ? 'border-negi bg-negi text-negi-foreground' : 'border-input')}>
                          {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-bold"><DietMark diet={o.diet} />{o.name}</span>
                          {o.description && <span className="mt-1 block text-sm text-muted-foreground">{o.description}</span>}
                        </span>
                        <span className="shrink-0 text-sm font-bold">{s.group === 'BASE' ? formatINR(o.price) : Number(o.price) > 0 ? `+${formatINR(o.price)}` : 'Free'}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {(options ?? []).length > 0 && (
            <fieldset className="mb-10">
              <legend className="mb-4 flex items-baseline gap-3"><span className="section-no">06</span><span className="font-display text-3xl">How hot?</span></legend>
              <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Spice level">
                {SPICE_LABEL.map((label, lvl) => (
                  <button key={label} type="button" role="radio" aria-checked={spice === lvl} onClick={() => setSpice(lvl)}
                    className={cn('press tap rounded-md border-2 px-2 py-3 text-sm font-bold', spice === lvl ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start" aria-label="Your wok">
          <div className="rounded-lg border-2 border-ink/80 bg-card p-5">
            <p className="section-no">Your wok</p>
            {chosen.length === 0 ? (
              <p className="mt-3 text-muted-foreground">Start with a base — your bowl builds here.</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {chosen.map((o) => <li key={o.id} className="flex justify-between gap-2"><span>{o.name}</span><span className="text-muted-foreground">{formatINR(o.price)}</span></li>)}
                <li className="flex justify-between gap-2 text-muted-foreground"><span>Spice</span><span>{SPICE_LABEL[spice]}</span></li>
              </ul>
            )}
            <div className="thin-rule my-4" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><DietMark diet={diet} /> Total</span>
              <span className="text-2xl font-bold" aria-live="polite">{formatINR(price)}</span>
            </div>
            {!ready && <p className="mt-3 text-sm text-muted-foreground">Still to choose: {missing.join(', ')}.</p>}
            <Button className="press tap mt-4 w-full font-bold" size="lg" disabled={!ready || busy} onClick={addToOrder}>
              <ShoppingBag className="mr-2 h-5 w-5" aria-hidden="true" />Add to order
            </Button>
            {isAuthenticated ? (
              <Button variant="outline" className="tap mt-2 w-full" disabled={!ready || busy} onClick={saveFavourite}>
                <Heart className="mr-2 h-4 w-4" aria-hidden="true" />Save as my usual
              </Button>
            ) : (
              <p className="mt-3 text-center text-sm"><Link className="font-bold text-negi underline" to="/login?redirect=/wok-bar">Log in</Link> to save it for next time.</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Price is confirmed by the kitchen when you add it. Cooked fresh, no Ajinomoto.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
