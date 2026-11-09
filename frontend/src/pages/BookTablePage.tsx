import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Minus, Plus, Share2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useBranch } from '@/context/BranchContext';
import { useBookTable, useCancelReservation, useMyReservations, useSlots } from '@/hooks/restaurantHooks';
import { BrushHeading } from '@/components/springonion/BrushHeading';
import { Reveal } from '@/components/springonion/Reveal';
import { Hanko } from '@/components/springonion/Hanko';
import { BUSINESS, whatsappShare } from '@/lib/business';
import { formatDateLong, toLocalIsoDate } from '@/lib/format';
import { usePageMeta } from '@/lib/usePageMeta';
import { OCCASIONS, type Occasion, type ReservationDto } from '@/types/restaurant';
import { cn } from '@/lib/utils';

const OCCASION_LABEL: Record<Occasion, string> = {
  NONE: 'Just dinner', BIRTHDAY: 'Birthday', ANNIVERSARY: 'Anniversary', DATE_NIGHT: 'Date night',
  FAMILY: 'Family meal', BUSINESS: 'Business', GROUP_PARTY: 'Group party',
};
const MAX_PARTY = 12;

function icsFor(r: ReservationDto): string {
  const [y, m, d] = r.date.split('-').map(Number);
  const [hh, mm] = r.time.split(':').map(Number);
  const p = (n: number) => String(n).padStart(2, '0');
  const start = `${y}${p(m)}${p(d)}T${p(hh)}${p(mm)}00`;
  const endH = hh + 2;
  const end = `${y}${p(m)}${p(d)}T${p(endH)}${p(mm)}00`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Spring Onion//Booking//EN', 'BEGIN:VEVENT',
    `UID:spring-onion-${r.id}@springonion`, `DTSTART;TZID=Asia/Kolkata:${start}`, `DTEND;TZID=Asia/Kolkata:${end}`,
    `SUMMARY:Spring Onion — table for ${r.partySize}`, `LOCATION:${BUSINESS.address.replace(/,/g, '\\,')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(r: ReservationDto) {
  const url = URL.createObjectURL(new Blob([icsFor(r)], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `spring-onion-${r.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BookTablePage() {
  usePageMeta('Book a table', 'Reserve a table at Spring Onion, Bhandarkar Road, Deccan Gymkhana, Pune. Lunch and dinner slots, live availability, confirmation by the host.');
  const { isAuthenticated } = useAuth();
  const { selectedBranchId } = useBranch();
  const today = toLocalIsoDate(new Date());
  const maxDate = toLocalIsoDate(new Date(Date.now() + 30 * 86400000));
  const [date, setDate] = useState(today);
  const [party, setParty] = useState(2);
  const [time, setTime] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<Occasion>('NONE');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [confirmed, setConfirmed] = useState<ReservationDto | null>(null);
  const { data: slots, isLoading: slotsLoading } = useSlots(date, selectedBranchId);
  const book = useBookTable();
  const cancel = useCancelReservation();
  const { data: mine } = useMyReservations();

  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!date || date < today || date > maxDate) e.date = 'Pick a date within the next 30 days.';
    if (!time) e.time = 'Pick a time.';
    if (party < 1 || party > MAX_PARTY) e.party = `Party size must be 1–${MAX_PARTY}.`;
    if (!name.trim()) e.name = 'Tell us the name for the booking.';
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (note.length > 500) e.note = 'Keep the note under 500 characters.';
    const s = slots?.find((x) => x.time === time);
    if (time && s && s.seatsLeft < party) e.time = `Only ${s.seatsLeft} seats left at ${s.label}.`;
    return e;
  }, [date, time, party, name, digits, note, slots, today, maxDate]);
  const canSave = Object.keys(errors).length === 0 && !book.isPending;
  const upcoming = (mine ?? []).filter((r) => r.date >= today && !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.statusCode));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    try {
      const r = await book.mutateAsync({ date, time: time!, partySize: party, occasion, note: note.trim() || null, contactName: name.trim(), contactPhone: digits, branchId: selectedBranchId });
      setConfirmed(r);
      window.scrollTo({ top: 0 });
    } catch {
      /* toasted by the interceptor */
    }
  }

  const errClass = (k: string) => (touched && errors[k] ? 'border-destructive focus-visible:ring-destructive' : '');
  const sittings = ['Lunch', 'Dinner'].map((s) => ({ s, items: (slots ?? []).filter((x) => x.sitting === s) }));

  if (confirmed) {
    const shareText = `I've booked a table for ${confirmed.partySize} at Spring Onion, Bhandarkar Road on ${formatDateLong(confirmed.date)} at ${confirmed.timeLabel}. See you there!`;
    return (
      <div className="washi min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Reveal effect="stamp-press" className="rounded-lg border-2 border-ink/80 bg-card p-8 text-center">
            <Hanko label="Requested" size="lg" className="mx-auto" />
            <h1 className="mt-6 font-display text-5xl">See you soon, {confirmed.contactName?.split(' ')[0]}</h1>
            <p className="mt-3 text-lg">Table for <strong>{confirmed.partySize}</strong> · {formatDateLong(confirmed.date)} · {confirmed.timeLabel}</p>
            <p className="mt-2 text-muted-foreground">Status: <strong>{confirmed.statusLabel}</strong>. Our host confirms bookings quickly — you can follow it live.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {confirmed.orderId && <Button asChild className="tap"><Link to={`/track/${confirmed.orderId}`}>Follow status</Link></Button>}
              <Button variant="outline" className="tap" onClick={() => downloadIcs(confirmed)}><CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />Add to calendar</Button>
              <Button asChild variant="outline" className="tap"><a href={whatsappShare(shareText)} target="_blank" rel="noreferrer"><Share2 className="mr-2 h-4 w-4" aria-hidden="true" />Tell your group</a></Button>
            </div>
            <Button variant="ghost" className="tap mt-4" onClick={() => { setConfirmed(null); setTime(null); setTouched(false); }}>Make another booking</Button>
          </Reveal>
        </div>
      </div>
    );
  }

  return (
    <div className="washi min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <p className="section-no mb-4">Lunch · Dinner · Celebrations</p>
        <BrushHeading level={1} accent="टेबल आरक्षित करा" accentLabel="Reserve a table">Reserve your table</BrushHeading>
        <p className="mt-4 max-w-2xl text-muted-foreground">Celebrating? Tell us the occasion and we’ll be ready for you. Our room is cosy, so booking ahead on weekend evenings is a good idea.</p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={submit} noValidate className="space-y-8 rounded-lg border bg-card p-5 sm:p-8" aria-describedby={touched && !canSave ? 'book-errors' : undefined}>
          {touched && Object.keys(errors).length > 0 && (
            <div id="book-errors" role="alert" className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm">
              <p className="font-bold">Please check:</p>
              <ul className="mt-1 list-disc pl-5">{Object.values(errors).map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-date">Date</Label>
              <Input id="b-date" type="date" min={today} max={maxDate} value={date} onChange={(e) => { setDate(e.target.value); setTime(null); }} className={cn('mt-1 h-11 text-base', errClass('date'))} />
            </div>
            <div>
              <Label id="b-party-label">Guests</Label>
              <div className={cn('mt-1 flex h-11 items-center justify-between rounded-md border', errClass('party'))} role="group" aria-labelledby="b-party-label">
                <button type="button" className="tap flex items-center justify-center" onClick={() => setParty((p) => Math.max(1, p - 1))} aria-label="One guest fewer"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                <span className="font-bold" aria-live="polite">{party} {party === 1 ? 'guest' : 'guests'}</span>
                <button type="button" className="tap flex items-center justify-center" onClick={() => setParty((p) => Math.min(MAX_PARTY, p + 1))} aria-label="One more guest"><Plus className="h-4 w-4" aria-hidden="true" /></button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">More than {MAX_PARTY}? <a className="underline" href={`tel:${BUSINESS.phoneTel}`}>Call us</a> for group parties.</p>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Time</legend>
            {slotsLoading && <Skeleton className="h-28" />}
            {sittings.map(({ s, items }) => items.length > 0 && (
              <div key={s} className="mb-4">
                <p className="section-no mb-2">{s}</p>
                <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-4', touched && errors.time && !time && 'rounded-md ring-2 ring-destructive')}>
                  {items.map((slot) => (
                    <button key={slot.time} type="button" disabled={!slot.available}
                      aria-pressed={time === slot.time}
                      aria-label={`${slot.label}${slot.available ? `, ${slot.seatsLeft} seats left` : ', not available'}`}
                      onClick={() => setTime(slot.time)}
                      className={cn('press tap rounded-md border-2 px-2 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40',
                        time === slot.time ? 'border-negi bg-negi text-negi-foreground' : 'bg-background hover:border-negi/60')}>
                      {slot.label}
                      <span className="block text-[0.7rem] font-normal">{slot.available ? (slot.seatsLeft < 8 ? `${slot.seatsLeft} seats left` : 'Available') : 'Unavailable'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="b-name">Name for the booking</Label>
              <Input id="b-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={cn('mt-1 h-11 text-base', errClass('name'))} />
            </div>
            <div>
              <Label htmlFor="b-phone">Mobile number</Label>
              <div className="mt-1 flex">
                <span className="flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm">+91</span>
                <Input id="b-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} className={cn('h-11 rounded-l-none text-base', errClass('phone'))} />
              </div>
            </div>
            <div>
              <Label htmlFor="b-occasion">Occasion</Label>
              <Select value={occasion} onValueChange={(v) => setOccasion(v as Occasion)}>
                <SelectTrigger id="b-occasion" className="mt-1 h-11 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>{OCCASIONS.map((o) => <SelectItem key={o} value={o}>{OCCASION_LABEL[o]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="b-note">Anything we should know? <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea id="b-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="High chair, Jain food, a quiet corner…" className={cn('mt-1 text-base', errClass('note'))} />
            </div>
          </div>

          {isAuthenticated ? (
            <Button type="submit" size="lg" className="press tap w-full text-base font-bold sm:w-auto" disabled={book.isPending || (touched && !canSave)}>
              {book.isPending ? 'Sending…' : 'Request this table'}
            </Button>
          ) : (
            <div className="rounded-md bg-secondary p-4">
              <p className="font-medium">Log in to send your booking — we’ll keep your choices here.</p>
              <Button asChild className="tap mt-3"><Link to="/login?redirect=/book">Log in or sign up</Link></Button>
            </div>
          )}
        </form>

        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <p className="section-no">Your bookings</p>
            {!isAuthenticated && <p className="mt-3 text-sm text-muted-foreground">Log in to see and manage your bookings.</p>}
            {isAuthenticated && upcoming.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No upcoming bookings yet.</p>}
            <ul className="mt-3 space-y-3">
              {upcoming.map((r) => (
                <li key={r.id} className="rounded-md border p-3">
                  <p className="font-bold">{formatDateLong(r.date)} · {r.timeLabel}</p>
                  <p className="text-sm text-muted-foreground">{r.partySize} guests · {r.statusLabel}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.orderId && <Button asChild size="sm" variant="outline"><Link to={`/track/${r.orderId}`}>Status</Link></Button>}
                    <Button size="sm" variant="ghost" onClick={() => downloadIcs(r)}>Calendar</Button>
                    {r.cancellable && (
                      <Button size="sm" variant="ghost" className="text-destructive" disabled={cancel.isPending}
                        onClick={() => { if (window.confirm('Cancel this booking?')) cancel.mutate(r.id); }}>Cancel</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border bg-card p-5 text-sm">
            <p className="font-bold">Prefer to talk?</p>
            <p className="mt-1 text-muted-foreground">{BUSINESS.hoursText}</p>
            <Button asChild variant="outline" className="tap mt-3"><a href={`tel:${BUSINESS.phoneTel}`}><Phone className="mr-2 h-4 w-4" aria-hidden="true" />{BUSINESS.phoneDisplay}</a></Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
