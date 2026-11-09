import { Car, Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBranches } from '@/hooks/branchHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { Reveal } from '@/components/springonion/Reveal';
import { StickyActions } from '@/components/springonion/StickyActions';
import { BUSINESS } from '@/lib/business';
import { openStatus } from '@/lib/hours';
import { usePageMeta } from '@/lib/usePageMeta';

export default function VisitPage() {
  usePageMeta('Visit — hours, address & directions', 'Spring Onion, Shop No-4B, Millennium Tower, Bhandarkar Road, Deccan Gymkhana, Pune 411004. Open daily for lunch and dinner. Call +91 97677 22444.');
  const { data: branches } = useBranches();
  const status = openStatus();
  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <p className="section-no mb-4">Contact & locations</p>
        <BrushHeading level={1} accent="आम्हाला भेटा" accentLabel="Come and see us">Find us on Bhandarkar Road</BrushHeading>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 md:grid-cols-[1fr_1.2fr]">
        <Reveal className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <p className={status.open ? 'font-bold text-negi' : 'font-bold'}>{status.text}</p>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-negi" aria-hidden="true" /><address className="not-italic">{BUSINESS.address}</address></li>
              <li className="flex gap-3"><Clock className="mt-1 h-5 w-5 shrink-0 text-negi" aria-hidden="true" />
                <dl className="grid grid-cols-[auto_1fr] gap-x-4">
                  {BUSINESS.hours.map((h) => (<div key={h.label} className="contents"><dt className="font-medium">{h.label}</dt><dd>{h.time}</dd></div>))}
                </dl>
              </li>
              <li className="flex gap-3"><Car className="mt-1 h-5 w-5 shrink-0 text-negi" aria-hidden="true" /><span>Parking on Bhandarkar Road gets tight in the evenings — an auto or cab is often easier.</span></li>
            </ul>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Button asChild className="tap"><a href={BUSINESS.mapsUrl} target="_blank" rel="noreferrer"><MapPin className="mr-2 h-4 w-4" aria-hidden="true" />Directions</a></Button>
              <Button asChild variant="outline" className="tap"><a href={`tel:${BUSINESS.phoneTel}`}><Phone className="mr-2 h-4 w-4" aria-hidden="true" />Call</a></Button>
              <Button asChild variant="outline" className="tap"><a href={BUSINESS.whatsappUrl()} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />WhatsApp</a></Button>
            </div>
          </div>
          {branches && branches.length > 1 && (
            <div className="rounded-lg border bg-card p-6">
              <p className="section-no">Our outlets</p>
              <ul className="mt-3 space-y-3">
                {branches.map((b) => (
                  <li key={b.id}>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-sm text-muted-foreground">{[b.addressLine, b.city].filter(Boolean).join(', ')}</p>
                    {b.googleMapsUrl && <a className="text-sm font-medium text-negi underline" href={b.googleMapsUrl} target="_blank" rel="noreferrer">Map</a>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Reveal>
        <Reveal delayMs={120} className="overflow-hidden rounded-lg border bg-card">
          <iframe
            title="Map showing Spring Onion on Bhandarkar Road, Deccan Gymkhana"
            src={BUSINESS.mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[24rem] w-full border-0 md:h-full md:min-h-[28rem]"
          />
        </Reveal>
      </div>
      <StickyActions />
    </div>
  );
}
