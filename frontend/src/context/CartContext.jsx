import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

// ─── Tier config (inlined — no separate file needed) ─────────
const TIER_LABELS = { 1: 'Standing', 2: 'Chair', 3: 'Sofa' };
const getTierLabel = (tier) => TIER_LABELS[tier] || `Tier ${tier}`;

// Map label string back to tier number
// ✅ FIXED — safely converts any type to string first
const labelToTierNum = (label = '') => {
  const str = String(label || '');
  const key = str.toLowerCase().trim();
  if (key === 'standing') return 1;
  if (key === 'chair')    return 2;
  if (key === 'sofa')     return 3;
  // fallback: parse number from e.g. "Tier 1" or "1"
  const n = parseInt(str.replace(/\D/g, ''));
  return [1, 2, 3].includes(n) ? n : 1;
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) setCartItems([]);
  }, [user]);

  // ── addTicketToCart ─────────────────────────────────────────
  const addTicketToCart = useCallback((item) => {
    const cartId = `ticket-${item.event_id}-${item.tier}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i =>
          i.cartId === cartId
            ? { ...i, quantity: Math.min(i.quantity + 1, 10) }
            : i
        );
      }
      return [...prev, {
        cartId,
        type:         'ticket',
        event_id:     item.event_id,
        event_title:  item.event_title,
        event_date:   item.event_date,
        banner_image: item.banner_image || '',
        tier:         item.tier,
        tier_label:   item.tier_label || getTierLabel(item.tier),
        price:        Number(item.price) || 0,
        quantity:     1,
      }];
    });
  }, []);

  // ── addTicket ───────────────────────────────────────────────
  // Used by Concerts.jsx: addTicket(event, { label, price }, qty)
  const addTicket = useCallback((event, tierInfo, qty = 1) => {
    const tierNum = labelToTierNum(tierInfo.label);
    const cartId  = `ticket-${event.id}-${tierNum}`;

    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i =>
          i.cartId === cartId
            ? { ...i, quantity: Math.min(i.quantity + qty, 10) }
            : i
        );
      }
      return [...prev, {
        cartId,
        type:         'ticket',
        event_id:     event.id,
        event_title:  event.title,
        event_date:   event.event_date,
        banner_image: event.banner_image || '',
        tier:         tierNum,
        tier_label:   getTierLabel(tierNum),
        price:        Number(tierInfo.price) || 0,
        quantity:     qty,
      }];
    });
  }, []);

  // ── getTicketInCart ─────────────────────────────────────────
 const getTicketInCart = useCallback((eventId, tierLabel) => {
  const str     = String(tierLabel || '');
  const key     = str.toLowerCase().trim();
  const labelMap = { standing: 1, chair: 2, sofa: 3 };
  let tierNum   = labelMap[key];
  if (!tierNum) {
    const n = parseInt(str.replace(/\D/g, ''));
    tierNum = [1, 2, 3].includes(n) ? n : 1;
  }
  const cartId = `ticket-${eventId}-${tierNum}`;
  return cartItems.find(i => i.cartId === cartId);
}, [cartItems]);

  // ── addProductToCart ────────────────────────────────────────
  const addProductToCart = useCallback((item) => {
    const cartId = `product-${item.item_id}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i =>
          i.cartId === cartId
            ? { ...i, quantity: Math.min(i.quantity + 1, item.stock || 99) }
            : i
        );
      }
      return [...prev, {
        cartId,
        type:        'product',
        item_id:     item.item_id,
        id:          item.item_id,
        title:       item.title,
        price:       Number(item.price) || 0,
        image_url:   item.image_url || '',
        stock:       item.stock || 99,
        seller_name: item.seller_name || '',
        category:    item.category || '',
        quantity:    1,
      }];
    });
  }, []);

  // ── updateQuantity ──────────────────────────────────────────
  const updateQuantity = useCallback((cartId, qty) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.cartId !== cartId));
    } else {
      setCartItems(prev =>
        prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i)
      );
    }
  }, []);

  const removeItem     = useCallback((cartId) => setCartItems(prev => prev.filter(i => i.cartId !== cartId)), []);
  const removeFromCart = useCallback((id)     => setCartItems(prev => prev.filter(i => i.cartId !== id && i.id !== id && i.item_id !== id)), []);
  const clearCart      = useCallback(()       => setCartItems([]), []);

  // ── Derived ─────────────────────────────────────────────────
  const ticketItems  = cartItems.filter(i => i.type === 'ticket');
  const productItems = cartItems.filter(i => i.type === 'product');
  const cartTotal    = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const cartCount    = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, ticketItems, productItems,
      cartTotal, cartCount,
      addTicket, addTicketToCart, getTicketInCart,
      addProductToCart,
      updateQuantity, removeItem, removeFromCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};

// Export helpers so other components can use the same labels
export const TIER_LABELS_MAP = TIER_LABELS;
export { getTierLabel };
