import { Link, useNavigate } from 'react-router-dom';
import { RotateCcw, Share2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/cart';
import { useMyOrders } from '@/hooks/orderHooks';
import { useFavourites, useMyReservations, usePassport } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { DishArt } from '@/components/springonion/DishArt';
import { AddToCart, FavouriteButton, cartLine } from '@/components/springonion/DishActions';
import { Hanko } from '@/components/springonion/Hanko';
import { whatsappShare } from '@/lib/business';
import { formatDateLong, formatINR, toLocalIsoDate } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import type { OrderDto } from '@/types/order';

const LIVE_DONE = ['COMPLETED', 'CANCELLED', 'DELIVERED', 'NO_SHOW', 'COLLECTED'];

export default function MySpringOnionPage() {
  usePageMeta('Your Spring Onion', 'Your favourites, one-tap reorder, live order tracking, bookings and passport stamps.');
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const { data: favourites, isLoading: favLoading } = useFavourites();
  const { data: bookings } = useMyReservations();
  const { data: passport } = usePassport();
  const today = toLocalIsoDate(new Date());

  const foodOrders = (orders ?? []).filter((o) => o.workflowCode !== 'table')
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const live = foodOrders.filter((o) => !LIVE_DONE.includes(o.currentStageCode ?? ''));
  const upcoming = (bookings ?? []).filter((r) => r.date >= today && !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.statusCode));

  function reorder(o: OrderDto) {
    const lines = o.items.filter((i) => i.itemType === 'DISH' || i.itemType === 'WOK');
    if (!lines.length) return;
    lines.forEach((i) => addItem(cartLine({ itemType: i.itemType as 'DISH' | 'WOK', itemId: i.itemId, name: i.name, price: i.unitPrice, imageUrl: i.imageUrl }), i.quantity));
    toast.success('Added to your order — prices are re-checked at checkout');
    navigate('/cart');
  }

  function addAllFavourites() {
    (favourites ?? []).forEach((f) => addItem(cartLine({ itemType: f.itemType as 'DISH' | 'WOK', itemId: f.itemId, name: f.item.name, price: Number(f.item.price), imageUrl: f.item.imageUrl }), 1));
    toast.success('Your usual is in the order');
    navigate('/cart');
  }

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <p className="section-no mb-4">Welcome back</p>
        <BrushHeading level={1} accent="तुमचं स्प्रिंग अनियन" accentLabel="Your Spring Onion">Your Spring Onion</BrushHeading>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {live.length > 0 && (
            <section aria-labelledby="live" className="rounded-lg border-2 border-negi bg-card p-5">
              <h2 id="live" className="flex items-center gap-2 font-bold"><Truck className="h-5 w-5 text-negi" aria-hidden="true" />On its way</h2>
              <ul className="mt-3 space-y-2">
                {live.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3">
                    <span>#{o.orderNumber} · {formatINR(o.total)}</span>
                    <Button asChild size="sm" className="tap"><Link to={`/track/${o.id}`}>Track live</Link></Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="usual">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="usual" className="font-display text-4xl">Your usual</h2>
              {(favourites ?? []).length > 0 && <Button className="tap font-bold" onClick={addAllFavourites}>Order all favourites</Button>}
            </div>
            {favLoading && <Skeleton className="mt-4 h-28" />}
            {!favLoading && (favourites ?? []).length === 0 && (
              <p className="mt-3 text-muted-foreground">Tap the heart on any dish — or save a wok from the <Link to="/wok-bar" className="font-medium text-negi underline">Wok Bar</Link> — and it lands here for one-tap reorder.</p>
            )}
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(favourites ?? []).map((f) => (
                <li key={f.id} className="flex gap-3 rounded-lg border bg-card p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md"><DishArt name={f.item.name} cuisine={f.item.category ?? 'CHINESE'} imageUrl={f.item.imageUrl} /></div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-bold leading-snug">{f.item.name}</p>
                    {f.itemType === 'WOK' && <Link to={`/wok-bar?combo=${f.itemId}`} className="text-xs text-negi underline">Edit this wok</Link>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="font-bold">{formatINR(Number(f.item.price))}</span>
                      <div className="flex items-center">
                        <FavouriteButton itemType={f.itemType as 'DISH' | 'WOK'} itemId={f.itemId} name={f.item.name} />
                        <AddToCart item={{ itemType: f.itemType as 'DISH' | 'WOK', itemId: f.itemId, name: f.item.name, price: Number(f.item.price), imageUrl: f.item.imageUrl }} />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="recent">
            <h2 id="recent" className="font-display text-4xl">Recent orders</h2>
            {ordersLoading && <Skeleton className="mt-4 h-28" />}
            {!ordersLoading && foodOrders.length === 0 && (
              <p className="mt-3 text-muted-foreground">No orders yet. <Link to="/order" className="font-medium text-negi underline">Start your first one</Link>.</p>
            )}
            <ul className="mt-4 space-y-3">
              {foodOrders.slice(0, 6).map((o) => (
                <li key={o.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">#{o.orderNumber} · {formatINR(o.total)}</p>
                    <span className="text-sm text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="tap" onClick={() => reorder(o)}><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />Reorder</Button>
                    <Button asChild size="sm" variant="outline" className="tap"><Link to={`/track/${o.id}`}>Track</Link></Button>
                    <Button asChild size="sm" variant="ghost" className="tap"><Link to={`/orders/${o.id}`}>Details</Link></Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-4">
              <Hanko label="Passport" tone="negi" shape="square" />
              <div>
                <p className="font-bold">{passport ? `${passport.stampedCount} of ${passport.total} stamps` : 'Oriental Passport'}</p>
                <Link to="/passport" className="text-sm font-medium text-negi underline">Open passport</Link>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="section-no">Upcoming bookings</p>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">None yet. <Link className="font-medium text-negi underline" to="/book">Book a table</Link></p>
            ) : (
              <ul className="mt-2 space-y-2">
                {upcoming.map((r) => (
                  <li key={r.id} className="text-sm"><strong>{formatDateLong(r.date)}, {r.timeLabel}</strong> · {r.partySize} guests · {r.statusLabel}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border bg-card p-5">
            <p className="font-bold">Bring a friend</p>
            <p className="mt-1 text-sm text-muted-foreground">Share Spring Onion with someone who’d love it.</p>
            <Button asChild variant="outline" className="tap mt-3">
              <a href={whatsappShare(`Have you tried Spring Onion on Bhandarkar Road? No Ajinomoto, amazing burnt garlic noodles. Order or book here: ${window.location.origin}`)} target="_blank" rel="noreferrer">
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />Share on WhatsApp
              </a>
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-5 text-sm">
            <p className="font-bold">Coins & account</p>
            <p className="mt-1 text-muted-foreground">Your loyalty tier, coins and saved addresses live in your account.</p>
            <Link to="/account" className="mt-2 inline-block font-medium text-negi underline">Go to account</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
