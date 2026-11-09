// Spring Onion — Bhandarkar Road, Deccan. Branding + navigation for the foundation shell.
// Header/footer colours are left to the theme tokens so both follow light/dark mode.
import type { SiteConfig } from '@/shell';
import { BUSINESS } from '@/lib/business';

const siteConfig: SiteConfig = {
  header: {
    brandName: 'Spring Onion',
    logoUrl: null,
    navLinks: [
      { label: 'Menu', href: '/menu' },
      { label: 'Wok Bar', href: '/wok-bar' },
      { label: 'Book a Table', href: '/book' },
      { label: 'Our Story', href: '/our-story' },
      { label: 'Passport', href: '/passport' },
      { label: 'Visit', href: '/visit' },
    ],
    ctaButton: { label: 'Order Online', href: '/order' },
    showAuth: true,
    showCart: true,
  },
  footer: {
    brandName: 'Spring Onion — Bhandarkar Road',
    tagline: 'No Aji. No Motto. Chinese, Thai & Pan-Asian, cooked fresh in the wok.',
    address: BUSINESS.address,
    phone: BUSINESS.phoneDisplay,
    email: null,
    openingHours: BUSINESS.hoursText,
    quickLinks: [
      { label: 'Order online', href: '/order' },
      { label: 'Book a table', href: '/book' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Your Spring Onion', href: '/me' },
      { label: 'Track an order', href: '/orders' },
    ],
    socialLinks: [{ platform: 'whatsapp', url: BUSINESS.whatsappUrl() }],
  },
};

export default siteConfig;
export { siteConfig };
