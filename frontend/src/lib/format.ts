const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** ₹ with Indian digit grouping, e.g. ₹1,25,000. */
export function formatINR(value: number | null | undefined): string {
  return inr.format(Number(value ?? 0));
}

export const CUISINE_LABEL: Record<string, string> = {
  CHINESE: 'Chinese',
  INDO_CHINESE: 'Indo-Chinese',
  THAI: 'Thai',
  JAPANESE: 'Japanese',
  PAN_ASIAN: 'Pan-Asian',
  DESSERT: 'Desserts',
  BEVERAGE: 'Drinks',
};

export const COURSE_LABEL: Record<string, string> = {
  SOUP: 'Soups',
  SALAD: 'Salads',
  STARTER: 'Starters',
  DIM_SUM: 'Dim sum & momos',
  MAIN: 'Mains',
  RICE_NOODLES: 'Rice & noodles',
  DESSERT: 'Desserts',
  DRINK: 'Drinks',
};

export const SPICE_LABEL = ['Mild', 'Medium', 'Hot', 'Fiery'];

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Local YYYY-MM-DD (not UTC) for date inputs. */
export function toLocalIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
