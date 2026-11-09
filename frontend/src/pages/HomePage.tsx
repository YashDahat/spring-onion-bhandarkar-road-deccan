import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import GallerySection from '@/components/gallery/GallerySection';
import { useBranch } from '@/context/BranchContext';
import { useAuth } from '@/context/AuthContext';
import { useFavourites, useMenu } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { SectionHeader } from '@/components/springonion/SectionHeader';
import { Reveal } from '@/components/springonion/Reveal';
import { Hanko } from '@/components/springonion/Hanko';
import { InkWok } from '@/components/springonion/InkWok';
import { DishArt } from '@/components/springonion/DishArt';
import { DietMark, SpiceMeter } from '@/components/springonion/DietMark';
import { AddToCart } from '@/components/springonion/DishActions';
import { StickyActions } from '@/components/springonion/StickyActions';
import { BUSINESS } from '@/lib/business';
import { formatINR } from '@/lib/format';
import { openStatus } from '@/lib/hours';
import { currentFestival } from '@/lib/festival';
import { usePageMeta } from '@/lib/usePageMeta';
import { cn } from '@/lib/utils';

const PROMISES = [
  { stamp: 'No MSG', tone: 'vermilion' as const, title: 'No Ajinomoto. Ever.', body: 'Our motto is printed on our name: “No Aji, No Motto.” Flavour comes from the wok, fresh produce and the sauce — not from a shaker.' },
  { stamp: '30+', tone: 'negi' as const, title: 'Sauces made in-house', body: 'Hakka, chilli basil, burnt garlic, burnt coriander, Schezwan and more — thirty-odd sauces, dips and chutneys from our own kitchen.' },
  { stamp: 'For 2', tone: 'saffron' as const, title: 'Portions that share well', body: 'Regulars say one main usually feeds two. Order a soup, a starter and a noodle bowl and you’re set.' },
];

const REGULARS = [
  'A bowl of Manchow or Tom Kha to start',
  'Chicken Chilli Dry and momos for the table',
  'Thai red curry with jasmine rice',
  'Burnt garlic noodles — smoky and simple',
  'Honey noodles with ice cream to finish',
];

export default function HomePage() {
  usePageMeta('Chinese & Thai on Bhandarkar Road, Deccan', 'Spring Onion, Bhandarkar Road, Deccan Gymkhana — Chinese, Thai and Pan-Asian with no Ajinomoto and 30+ house sauces. Order online or book a table.');
  const { selectedBranchId } = useBranch();
  const { isAuthenticated } = useAuth();
  const { data: menu, isLoading } = useMenu({ branchId: selectedBranchId });
  const { data: favourites } = useFavourites();
  const signatures = (menu ?? []).filter((m) => m.signature).slice(0, 6);
  const status = openStatus();
  const festival = currentFestival();

  return (
    <div className="washi">
      {festival && (
        <div className={cn('px-4 py-2 text-center text-sm font-medium', festival.tone === 'saffron' ? 'bg-saffron/25' : festival.tone === 'negi' ? 'bg-secondary' : 'bg-primary/10')}>
          {festival.greeting} · <span lang="mr" className="font-deva">{festival.marathi}</span>
        </div>
      )}

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.15fr_0.85fr] md:pt-20" aria-labelledby="hero-title">
        <div>
          <p className="section-no mb-5">Bhandarkar Road · Deccan Gymkhana · Pune</p>
          <BrushHeading level={1} id="hero-title" accent="भांडारकर रस्त्यावरचं एशियन किचन" accentLabel="The Asian kitchen on Bhandarkar Road">
            No Aji.<br />No Motto.
          </BrushHeading>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Chinese, Thai and Pan-Asian, cooked fresh in the wok — with no Ajinomoto and thirty-odd sauces made in our own kitchen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="press tap text-base font-bold">
              <Link to="/order">Order now <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="press tap border-2 border-negi text-base font-bold text-negi hover:text-negi">
              <Link to="/book">Reserve your table</Link>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-saffron text-saffron" aria-hidden="true" /><span><strong>{BUSINESS.rating}</strong> from {BUSINESS.reviewCount.toLocaleString('en-IN')} Google reviews</span></li>
            <li className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-negi" aria-hidden="true" /><span className={status.open ? 'font-medium text-negi' : ''}>{status.text}</span></li>
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <InkWok />
          <Reveal effect="stamp-press" className="absolute bottom-6 left-2">
            <Hanko label="Wok fresh" size="lg" />
          </Reveal>
        </div>
      </section>

      {/* 01 Who we are */}
      <section className="border-t bg-background/60" aria-labelledby="who">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeader no="01 — Who we are" id="who" title="A small kitchen with one big rule" lead="Spring Onion has cooked Chinese and Thai for Pune for years. The room on Bhandarkar Road is cosy and busy; the cooking is clean, bright and never heavy-handed." />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROMISES.map((p, i) => (
              <Reveal key={p.title} effect="stamp-press" delayMs={i * 90} className={cn('rounded-lg border bg-card p-6', i === 1 && 'md:translate-y-8')}>
                <Hanko label={p.stamp} tone={p.tone} />
                <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-muted-foreground">{p.body}</p>
              </Reveal>
            ))}
          </div>
          <Link to="/our-story" className="mt-16 inline-flex items-center gap-2 font-bold text-negi underline-offset-4 hover:underline">
            Read our story <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* 02 What we make */}
      <section className="border-t" aria-labelledby="make">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader no="02 — What we make" id="make" title="Signature plates" lead="The dishes people name in their reviews, again and again." accent="खास पदार्थ" accentLabel="Signature dishes" />
            <Button asChild variant="outline" className="tap"><Link to="/menu">See the full menu</Link></Button>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-lg" />)}
            {!isLoading && signatures.length === 0 && (
              <p className="text-muted-foreground">Our menu is being updated — please check back in a moment.</p>
            )}
            {signatures.map((d, i) => (
              <Reveal key={d.id} effect="stamp-press" delayMs={(i % 3) * 80} className="group flex flex-col overflow-hidden rounded-lg border bg-card">
                <div className="relative aspect-[4/3]">
                  <DishArt name={d.name} cuisine={d.cuisine} imageUrl={d.imageUrl} />
                  <Hanko label="Signature" size="sm" className="absolute right-3 top-3" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    <DietMark diet={d.diet} />
                    <h3 className="text-lg font-bold">{d.name}</h3>
                  </div>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{d.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-bold">{formatINR(d.price)}</span>
                      <SpiceMeter level={d.spiceLevel} className="ml-2" />
                    </div>
                    <AddToCart item={{ itemType: 'DISH', itemId: d.id, name: d.name, price: d.price, imageUrl: d.imageUrl }} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 03 Why people return */}
      <section className="border-t bg-secondary/50" aria-labelledby="return">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <SectionHeader no="03 — Why people return" id="return" title="What the regulars order" />
            <ol className="mt-8 space-y-4">
              {REGULARS.map((r, i) => (
                <Reveal as="li" key={r} delayMs={i * 70} className="flex gap-4 border-b pb-4">
                  <span className="font-display text-3xl leading-none text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pt-1 text-lg">{r}</span>
                </Reveal>
              ))}
            </ol>
            {isAuthenticated && favourites && favourites.length > 0 && (
              <div className="mt-8 rounded-lg border bg-card p-5">
                <p className="font-bold">Your usual is one tap away</p>
                <p className="text-sm text-muted-foreground">{favourites.length} saved favourite{favourites.length > 1 ? 's' : ''}.</p>
                <Button asChild className="tap mt-3"><Link to="/me">Reorder your usual</Link></Button>
              </div>
            )}
          </div>
          <div className="grid gap-6">
            <Reveal className="rounded-lg border bg-card p-6 md:ml-10">
              <p className="section-no">New · Wok Bar</p>
              <h3 className="mt-2 font-display text-4xl">Build your own wok</h3>
              <p className="mt-2 text-muted-foreground">Pick a base, a protein and one of our house sauces, add greens and set the heat. We cook it fresh, you save it for next time.</p>
              <Button asChild variant="outline" className="tap mt-4 border-2 border-negi font-bold text-negi hover:text-negi"><Link to="/wok-bar">Open the Wok Bar</Link></Button>
            </Reveal>
            <Reveal effect="stamp-press" className="flex gap-5 rounded-lg border bg-card p-6">
              <Hanko label="Passport" tone="negi" shape="square" size="lg" />
              <div>
                <p className="section-no">New · Oriental Passport</p>
                <h3 className="mt-2 font-display text-4xl">Collect a stamp for every classic</h3>
                <p className="mt-2 text-muted-foreground">Eat your way through our signature dishes — every one you try earns a hanko stamp, and every fourth stamp unlocks a reward.</p>
                <Link to="/passport" className="mt-3 inline-flex items-center gap-2 font-bold text-negi hover:underline">See your passport <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 04 Order or visit */}
      <section className="border-t" aria-labelledby="visit">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeader no="04 — Order or visit" id="visit" title="Hot from the wok, your way" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="rounded-lg bg-primary p-8 text-primary-foreground">
              <h3 className="font-display text-4xl">Order online</h3>
              <p className="mt-3 opacity-90">Pickup from Bhandarkar Road or delivery. Pay by UPI, card or at the counter for pickups. Watch your order move from the wok to your door, live.</p>
              <Button asChild size="lg" variant="secondary" className="tap mt-6 font-bold"><Link to="/order">Start an order</Link></Button>
            </Reveal>
            <Reveal delayMs={100} className="rounded-lg border bg-card p-8">
              <h3 className="font-display text-4xl">Come and eat with us</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-negi" aria-hidden="true" /><span>{BUSINESS.address}</span></li>
                <li className="flex gap-3"><Clock className="mt-1 h-5 w-5 shrink-0 text-negi" aria-hidden="true" /><span>{BUSINESS.hoursText}</span></li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="outline" className="tap"><a href={BUSINESS.mapsUrl} target="_blank" rel="noreferrer"><MapPin className="mr-2 h-4 w-4" aria-hidden="true" />Directions</a></Button>
                <Button asChild variant="outline" className="tap"><a href={`tel:${BUSINESS.phoneTel}`}><Phone className="mr-2 h-4 w-4" aria-hidden="true" />Call</a></Button>
                <Button asChild variant="outline" className="tap"><a href={BUSINESS.whatsappUrl()} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />WhatsApp</a></Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t" aria-label="Gallery">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <GallerySection section="WEBSITE" title="From our kitchen" />
        </div>
      </section>
      <StickyActions />
    </div>
  );
}
