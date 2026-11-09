import { Link, useParams } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrack } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { BUSINESS } from '@/lib/business';
import { formatINR } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import { cn } from '@/lib/utils';

export default function TrackPage() {
  const { id } = useParams();
  const orderId = id ? Number(id) : null;
  const { data: t, isLoading, isError } = useTrack(orderId);
  const isBooking = t?.workflowCode === 'table';
  usePageMeta(isBooking ? 'Your booking' : 'Track your order');
  const doneCount = t ? t.steps.filter((s) => s.state === 'DONE').length : 0;
  const pct = t && t.steps.length > 1 ? Math.min(1, (doneCount - (t.finished ? 1 : 0) + (t.finished ? 1 : 0.5)) / t.steps.length) : 0;

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="section-no mb-4">{isBooking ? 'Table booking' : 'Live order'}{t ? ` · #${t.orderNumber}` : ''}</p>
        {isLoading && <Skeleton className="h-64" />}
        {isError && (
          <div role="alert" className="rounded-lg border bg-card p-6">
            <p className="font-bold">We couldn’t find that order.</p>
            <Button asChild className="tap mt-3"><Link to="/me">Back to your orders</Link></Button>
          </div>
        )}
        {t && (
          <>
            <BrushHeading level={1}>{t.cancelled ? 'Cancelled' : t.currentStageLabel}</BrushHeading>
            <p className="mt-3 text-muted-foreground" aria-live="polite">
              {t.cancelled ? 'This was cancelled. Any refund due follows the stage it was cancelled at.'
                : t.finished ? 'All done — thank you for choosing Spring Onion.'
                  : 'This page updates by itself every few seconds.'}
            </p>
            {!isBooking && <p className="mt-1 text-sm">Total {formatINR(t.total)} · {t.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}</p>}

            <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className={cn('h-full origin-left transition-transform duration-700 ease-out motion-reduce:transition-none', t.cancelled ? 'bg-muted-foreground' : 'bg-negi')} style={{ transform: `scaleX(${t.cancelled ? 1 : pct})` }} />
            </div>

            <ol className="mt-8 space-y-0">
              {t.steps.map((s, i) => (
                <li key={s.code} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < t.steps.length - 1 && <span className={cn('absolute left-[0.95rem] top-8 h-[calc(100%-2rem)] w-0.5', s.state === 'DONE' ? 'bg-negi' : 'bg-border')} aria-hidden="true" />}
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                    s.state === 'DONE' && 'border-negi bg-negi text-negi-foreground',
                    s.state === 'CURRENT' && 'border-primary bg-background text-primary',
                    (s.state === 'UPCOMING' || s.state === 'SKIPPED') && 'border-border bg-background text-muted-foreground')}>
                    {s.state === 'DONE' ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <div>
                    <p className={cn('font-bold', s.state === 'UPCOMING' && 'text-muted-foreground')}>
                      {s.label}{s.state === 'CURRENT' && <span className="sr-only"> (current step)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.enteredAt ? new Date(s.enteredAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
                        : s.state === 'CURRENT' || s.state === 'UPCOMING' ? (s.targetMinutes ? `usually ~${s.targetMinutes} min` : '') : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="tap"><Link to={`/orders/${t.orderId}`}>Order details</Link></Button>
              <Button asChild variant="outline" className="tap">
                <a href={BUSINESS.whatsappUrl(`Hi Spring Onion, about my ${isBooking ? 'booking' : 'order'} #${t.orderNumber}: `)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />Message us
                </a>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
