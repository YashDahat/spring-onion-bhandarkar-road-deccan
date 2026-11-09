import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Stamp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import RecommendationWidget from '@/components/recommendations/RecommendationWidget';
import { useCart } from '@/cart';
import { useBranch } from '@/context/BranchContext';
import { useMenu } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { DishArt } from '@/components/springonion/DishArt';
import { DietMark, SpiceMeter } from '@/components/springonion/DietMark';
import { Hanko } from '@/components/springonion/Hanko';
import { AddToCart, FavouriteButton } from '@/components/springonion/DishActions';
import { StickyActions } from '@/components/springonion/StickyActions';
import { COURSE_LABEL, CUISINE_LABEL, formatINR } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import { COURSES, type Cuisine, type MenuItemDto } from '@/types/restaurant';
import { cn } from '@/lib/utils';

export default function MenuPage({ mode = 'menu' }: { mode?: 'menu' | 'order' }) {
  usePageMeta(mode === 'order' ? 'Order online — pickup or delivery' : 'Menu — Chinese, Thai & Pan-Asian',
    'The Spring Onion menu: Manchow and Tom Kha soups, Chicken Chilli Dry, momos, Thai red curry, burnt garlic noodles, Pad Thai and more. Veg markers, spice levels and prices in ₹.');
  const { selectedBranchId } = useBranch();
  const { data, isLoading, isError, refetch } = useMenu({ branchId: selectedBranchId });
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | 'ALL'>('ALL');
  const [vegOnly, setVegOnly] = useState(false);
  const [jainOnly, setJainOnly] = useState(false);
  const { cartItems, cartCount, totals } = useCart();
  const highlight = params.get('dish');

  useEffect(() => {
    if (!highlight || !data) return;
    document.getElementById(`dish-${highlight}`)?.scrollIntoView({ block: 'center' });
  }, [highlight, data]);

  const cuisines = useMemo(() => Array.from(new Set((data ?? []).map((d) => d.cuisine))), [data]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((d) =>
      (cuisine === 'ALL' || d.cuisine === cuisine)
      && (!vegOnly || d.diet === 'VEG')
      && (!jainOnly || d.jainOption)
      && (!needle || d.name.toLowerCase().includes(needle) || (d.description ?? '').toLowerCase().includes(needle)));
  }, [data, q, cuisine, vegOnly, jainOnly]);
  const byCourse = COURSES.map((c) => ({ course: c, items: filtered.filter((d) => d.course === c) })).filter((g) => g.items.length);
  const lastDish = [...cartItems].reverse().find((c) => String(c.id).startsWith('DISH:'));
  const lastDishId = lastDish ? Number(String(lastDish.id).split(':')[1]) : null;

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-10">
        <p className="section-no mb-4">{mode === 'order' ? 'Pickup · Delivery · UPI' : 'The menu'}</p>
        <BrushHeading level={1} accent="मेनू" accentLabel="Menu">{mode === 'order' ? 'Order online' : 'From our wok'}</BrushHeading>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Every dish is cooked to order, with no Ajinomoto. Tell us about allergies in the order note — dishes marked “Jain on request” can be made without onion, garlic or root vegetables.
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-30 border-y bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[12rem] flex-1">
              <Label htmlFor="menu-search" className="sr-only">Search the menu</Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="menu-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search noodles, momos, curry…" className="h-11 pl-9 text-base" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="veg-only" checked={vegOnly} onCheckedChange={setVegOnly} />
              <Label htmlFor="veg-only" className="flex items-center gap-1.5"><DietMark diet="VEG" /> Veg only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="jain-only" checked={jainOnly} onCheckedChange={setJainOnly} />
              <Label htmlFor="jain-only">Jain on request</Label>
            </div>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by cuisine">
            {(['ALL', ...cuisines] as (Cuisine | 'ALL')[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cuisine === c}
                onClick={() => setCuisine(c)}
                className={cn('tap shrink-0 rounded-full border px-4 text-sm font-medium transition-colors',
                  cuisine === c ? 'border-negi bg-negi text-negi-foreground' : 'bg-card hover:bg-accent')}
              >
                {c === 'ALL' ? 'All' : CUISINE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {isLoading && <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>}
        {isError && (
          <div role="alert" className="rounded-lg border bg-card p-6">
            <p className="font-bold">We couldn’t load the menu.</p>
            <p className="text-muted-foreground">Check your connection and try again.</p>
            <Button className="tap mt-3" onClick={() => refetch()}>Try again</Button>
          </div>
        )}
        {!isLoading && !isError && byCourse.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="font-display text-3xl">Nothing matches that</p>
            <p className="mt-2 text-muted-foreground">Try another word or clear the filters.</p>
            <Button variant="outline" className="tap mt-4" onClick={() => { setQ(''); setCuisine('ALL'); setVegOnly(false); setJainOnly(false); }}>Clear filters</Button>
          </div>
        )}
        {byCourse.map((g, gi) => (
          <section key={g.course} className="mb-14" aria-labelledby={`course-${g.course}`}>
            <div className="mb-6 flex items-center gap-4">
              <span className="section-no">{String(gi + 1).padStart(2, '0')}</span>
              <h2 id={`course-${g.course}`} className="font-display text-4xl">{COURSE_LABEL[g.course]}</h2>
              <span className="thin-rule flex-1" />
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {g.items.map((d) => <DishRow key={d.id} dish={d} highlighted={highlight === d.slug} />)}
            </ul>
          </section>
        ))}

        {lastDishId != null && (
          <div className="mt-6 rounded-lg border bg-card p-5">
            <RecommendationWidget itemType="DISH" itemId={lastDishId} type="CROSS_SELL" title="Goes well with your order" branchId={selectedBranchId ?? undefined} />
          </div>
        )}
      </div>

      {cartCount > 0 ? (
        <>
          <div className="h-24" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 backdrop-blur" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <p className="text-sm"><strong>{cartCount} item{cartCount > 1 ? 's' : ''}</strong> · {formatINR(totals.total)}</p>
              <Button asChild size="lg" className="press tap font-bold">
                <Link to="/cart"><ShoppingBag className="mr-2 h-5 w-5" aria-hidden="true" />View order</Link>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <StickyActions />
      )}
    </div>
  );
}

function DishRow({ dish: d, highlighted }: { dish: MenuItemDto; highlighted: boolean }) {
  return (
    <li id={`dish-${d.slug}`} className={cn('flex gap-4 rounded-lg border bg-card p-3 sm:p-4', highlighted && 'ring-2 ring-negi')}>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md sm:h-28 sm:w-28">
        <DishArt name={d.name} cuisine={d.cuisine} imageUrl={d.imageUrl} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <DietMark diet={d.diet} />
              <h3 className="font-bold leading-snug">{d.name}</h3>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <SpiceMeter level={d.spiceLevel} />
              <span>{CUISINE_LABEL[d.cuisine]}</span>
              {d.jainOption && <span>Jain on request</span>}
              {d.passport && <span className="inline-flex items-center gap-1 text-negi"><Stamp className="h-3.5 w-3.5" aria-hidden="true" />Passport stamp</span>}
            </div>
          </div>
          {d.signature && <Hanko label="Signature" size="sm" className="hidden sm:inline-flex" />}
        </div>
        {d.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-bold">{formatINR(d.price)}</span>
          <div className="flex items-center gap-1">
            <FavouriteButton itemType="DISH" itemId={d.id} name={d.name} />
            <AddToCart item={{ itemType: 'DISH', itemId: d.id, name: d.name, price: d.price, imageUrl: d.imageUrl }} />
          </div>
        </div>
      </div>
    </li>
  );
}
