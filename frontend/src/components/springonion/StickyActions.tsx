import { Link } from 'react-router-dom';
import { CalendarDays, ShoppingBag } from 'lucide-react';

/** Mobile-only bottom bar keeping the two primary actions one thumb away. */
export function StickyActions() {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Quick actions"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t bg-background/95 px-3 pt-2 backdrop-blur md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <Link to="/order" className="press tap flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-3 font-bold text-primary-foreground">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Order now
        </Link>
        <Link to="/book" className="press tap flex items-center justify-center gap-2 rounded-md border-2 border-negi px-3 py-3 font-bold text-negi">
          <CalendarDays className="h-5 w-5" aria-hidden="true" /> Book a table
        </Link>
      </nav>
    </>
  );
}
