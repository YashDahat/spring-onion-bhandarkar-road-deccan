// Festival theming hook: a gentle greeting (never a fake offer) during major festivals. Edit dates yearly.
export interface Festival { key: string; greeting: string; marathi: string; tone: 'saffron' | 'negi' | 'vermilion' }

const FESTIVALS: { from: string; to: string; f: Festival }[] = [
  { from: '2026-11-05', to: '2026-11-11', f: { key: 'diwali', greeting: 'Happy Diwali from all of us at Spring Onion', marathi: 'शुभ दीपावली', tone: 'saffron' } },
  { from: '2026-12-22', to: '2026-12-26', f: { key: 'christmas', greeting: 'Merry Christmas, Pune', marathi: 'नाताळाच्या शुभेच्छा', tone: 'vermilion' } },
  { from: '2026-12-31', to: '2027-01-01', f: { key: 'new-year', greeting: 'Happy New Year — see you at the wok', marathi: 'नवीन वर्षाच्या शुभेच्छा', tone: 'negi' } },
  { from: '2027-01-13', to: '2027-01-15', f: { key: 'sankranti', greeting: 'Happy Makar Sankranti', marathi: 'तिळगूळ घ्या, गोड गोड बोला', tone: 'saffron' } },
];

export function currentFestival(today = new Date()): Festival | null {
  const p = (n: number) => String(n).padStart(2, '0');
  const iso = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;
  return FESTIVALS.find((x) => iso >= x.from && iso <= x.to)?.f ?? null;
}
