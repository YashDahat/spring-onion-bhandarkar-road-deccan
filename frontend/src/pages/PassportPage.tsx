import { Link } from 'react-router-dom';
import { Gift, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useClaimMilestone, useMenu, usePassport } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { Reveal } from '@/components/springonion/Reveal';
import { Hanko } from '@/components/springonion/Hanko';
import { DietMark } from '@/components/springonion/DietMark';
import { whatsappShare } from '@/lib/business';
import { CUISINE_LABEL } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import { cn } from '@/lib/utils';

export default function PassportPage() {
  usePageMeta('Oriental Passport', 'Collect a hanko stamp for every Spring Onion classic you try. Every fourth stamp unlocks a reward.');
  const { isAuthenticated } = useAuth();
  const { data: passport, isLoading } = usePassport();
  const { data: menu } = useMenu({});
  const claim = useClaimMilestone();
  const previewDishes = (menu ?? []).filter((m) => m.passport);

  const stamps = isAuthenticated && passport
    ? passport.stamps
    : previewDishes.map((d) => ({ itemId: d.id, name: d.name, slug: d.slug, cuisine: d.cuisine, diet: d.diet, stamped: false, stampedAt: null }));
  const count = passport?.stampedCount ?? 0;
  const total = passport?.total ?? previewDishes.length;

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <p className="section-no mb-4">New · A reason to try one more</p>
        <BrushHeading level={1} accent="चवीचा पासपोर्ट" accentLabel="A passport of flavours">The Oriental Passport</BrushHeading>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Every passport dish you order earns a hanko stamp. Collect 4, 8 and 12 stamps to unlock rewards — and work your way from Manchow to honey noodles.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-24">
        {isAuthenticated ? (
          <div className="mb-10 rounded-lg border-2 border-ink/80 bg-card p-6">
            {isLoading ? <Skeleton className="h-20" /> : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="section-no">Your progress</p>
                    <p className="mt-1 font-display text-5xl">{count} <span className="text-2xl text-muted-foreground">/ {total} stamps</span></p>
                  </div>
                  <Button asChild variant="outline" className="tap">
                    <a href={whatsappShare(`I've collected ${count} of ${total} stamps in the Spring Onion Oriental Passport. Come eat with me!`)} target="_blank" rel="noreferrer">
                      <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />Share on WhatsApp
                    </a>
                  </Button>
                </div>
                <Progress value={total ? (count / total) * 100 : 0} className="mt-4 h-2" aria-label={`${count} of ${total} stamps collected`} />
                <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                  {(passport?.milestones ?? []).map((m) => (
                    <li key={m.at} className={cn('rounded-md border p-4', m.reached && 'border-negi bg-secondary')}>
                      <p className="font-bold">{m.at} stamps</p>
                      {m.claimed ? (
                        <p className="mt-1 text-sm">{m.offerCode ? <>Code: <strong className="font-mono">{m.offerCode}</strong></> : 'Claimed'}</p>
                      ) : m.reached ? (
                        <Button size="sm" className="tap mt-2" disabled={claim.isPending} onClick={() => claim.mutate(m.at)}>
                          <Gift className="mr-2 h-4 w-4" aria-hidden="true" />Claim reward
                        </Button>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">{m.at - count} to go</p>
                      )}
                    </li>
                  ))}
                </ul>
                {claim.data && <p role="status" className="mt-4 rounded-md bg-secondary p-3 text-sm">{claim.data.message}{claim.data.offerCode && <> Code: <strong className="font-mono">{claim.data.offerCode}</strong></>}</p>}
              </>
            )}
          </div>
        ) : (
          <div className="mb-10 rounded-lg border bg-card p-6">
            <p className="font-bold">Your passport starts with your first order.</p>
            <p className="mt-1 text-muted-foreground">Log in to see your stamps — every past order already counts.</p>
            <Button asChild className="tap mt-4"><Link to="/login?redirect=/passport">Log in to see your passport</Link></Button>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stamps.map((s, i) => (
            <Reveal as="li" key={s.itemId} effect="stamp-press" delayMs={(i % 4) * 60}
              className={cn('flex flex-col items-center rounded-lg border bg-card p-4 text-center', s.stamped && 'border-primary/40')}>
              <Hanko label={s.stamped ? 'Tasted' : String(i + 1).padStart(2, '0')} empty={!s.stamped} size="lg" />
              <p className="mt-3 flex items-center gap-1.5 font-bold"><DietMark diet={s.diet} />{s.name}</p>
              <p className="text-xs text-muted-foreground">{CUISINE_LABEL[s.cuisine]}</p>
              {!s.stamped && <Link to={`/menu?dish=${s.slug}`} className="mt-2 text-sm font-medium text-negi underline-offset-4 hover:underline">Order to stamp</Link>}
            </Reveal>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted-foreground">Stamps count once each, from paid orders that weren’t cancelled. Rewards follow our loyalty terms and may be paused at times; your stamps are always kept.</p>
      </div>
    </div>
  );
}
