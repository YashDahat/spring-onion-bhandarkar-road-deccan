// Open-now status for the Bhandarkar Road kitchen (Asia/Kolkata), from the listed hours.
const SITTINGS: [number, number][] = [
  [11 * 60 + 30, 15 * 60 + 30],
  [18 * 60 + 30, 23 * 60 + 30],
];

function istMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function openStatus(now = new Date()): { open: boolean; text: string } {
  const t = istMinutes(now);
  for (const [o, c] of SITTINGS) {
    if (t >= o && t < c) return { open: true, text: c - t <= 45 ? 'Open — closing soon' : 'Open now' };
  }
  if (t < SITTINGS[0][0]) return { open: false, text: 'Opens at 11:30 am' };
  if (t < SITTINGS[1][0]) return { open: false, text: 'Opens again at 6:30 pm' };
  return { open: false, text: 'Opens tomorrow at 11:30 am' };
}
