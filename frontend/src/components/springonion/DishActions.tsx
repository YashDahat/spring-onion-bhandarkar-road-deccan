import { Heart, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/cart';
import { useAuth } from '@/context/AuthContext';
import { useFavourites, useToggleFavourite } from '@/hooks/restaurantHooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Sellable { itemType: 'DISH' | 'WOK'; itemId: number; name: string; price: number; imageUrl?: string | null }

export function cartLine(s: Sellable) {
  return {
    id: `${s.itemType}:${s.itemId}`,
    name: s.name,
    unitPrice: Number(s.price),
    imageUrl: s.imageUrl ?? null,
    metadata: { itemType: s.itemType, itemId: s.itemId },
  };
}

/** Add / step quantity in the cart for one dish or wok. */
export function AddToCart({ item, className }: { item: Sellable; className?: string }) {
  const { cartItems, addItem, setItemQuantity } = useCart();
  const id = `${item.itemType}:${item.itemId}`;
  const qty = cartItems.find((c) => c.id === id && !c.variantKey)?.quantity ?? 0;
  if (qty === 0) {
    return (
      <Button className={cn('press tap font-bold', className)} onClick={() => addItem(cartLine(item), 1)} aria-label={`Add ${item.name} to order`}>
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Add
      </Button>
    );
  }
  return (
    <div className={cn('inline-flex items-center rounded-md border-2 border-primary', className)} role="group" aria-label={`${item.name} quantity`}>
      <button type="button" className="tap press flex items-center justify-center text-primary" onClick={() => setItemQuantity(id, qty - 1)} aria-label={`Remove one ${item.name}`}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-[2ch] text-center font-bold" aria-live="polite">{qty}</span>
      <button type="button" className="tap press flex items-center justify-center text-primary" onClick={() => setItemQuantity(id, qty + 1)} aria-label={`Add one more ${item.name}`}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Heart toggle; guests are sent to log in and come back. */
export function FavouriteButton({ itemType, itemId, name, className }: { itemType: 'DISH' | 'WOK'; itemId: number; name: string; className?: string }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: favs } = useFavourites();
  const toggle = useToggleFavourite();
  const saved = !!favs?.some((f) => f.itemType === itemType && f.itemId === itemId);
  return (
    <button
      type="button"
      className={cn('tap press inline-flex items-center justify-center rounded-full text-primary hover:bg-accent', className)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      disabled={toggle.isPending}
      onClick={() => {
        if (!isAuthenticated) {
          navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        toggle.mutate({ itemType, itemId, name });
      }}
    >
      <Heart className={cn('h-5 w-5', saved && 'fill-current')} aria-hidden="true" />
    </button>
  );
}
