import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // ── Clear cart whenever user logs out ────────────────────────────────────────
  useEffect(() => {
    if (!user) setCartItems([]);
  }, [user]);

  // ── addTicketToCart ───────────────────────────────────────────────────────────
  // Used by any component that builds the item object itself
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
        tier_label:   item.tier_label || `Tier ${item.tier}`,
        price:        Number(item.price) || 0,
        quantity:     1,
      }];
    });
  }, []);

  // ── addTicket ─────────────────────────────────────────────────────────────────
  // Matches Concerts.jsx call: addTicket(event, { label, price }, qty)
  // event shape: { id, title, event_date, banner_image }
  const addTicket = useCallback((event, tierInfo, qty = 1) => {
    const tierNum = parseInt(tierInfo.label?.replace(/\D/g, '')) || 1;
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
        tier_label:   tierInfo.label || `Tier ${tierNum}`,
        price:        Number(tierInfo.price) || 0,
        quantity:     qty,
      }];
    });
  }, []);

  // ── getTicketInCart ───────────────────────────────────────────────────────────
  // Concerts.jsx: getTicketInCart(event.id, tier.label) → item | undefined
  const getTicketInCart = useCallback((eventId, tierLabel) => {
    const tierNum = parseInt(String(tierLabel)?.replace(/\D/g, '')) || 1;
    const cartId  = `ticket-${eventId}-${tierNum}`;
    return cartItems.find(i => i.cartId === cartId);
  }, [cartItems]);

  // ── addProductToCart ──────────────────────────────────────────────────────────
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

  // ── updateQuantity(cartId, newQty) ────────────────────────────────────────────
  const updateQuantity = useCallback((cartId, qty) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.cartId !== cartId));
    } else {
      setCartItems(prev =>
        prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i)
      );
    }
  }, []);

  // ── removeItem(cartId) — used by pages/Cart.jsx ───────────────────────────────
  const removeItem = useCallback((cartId) => {
    setCartItems(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  // ── removeFromCart(id) — alias for component/Cart.jsx ────────────────────────
  const removeFromCart = useCallback((id) => {
    setCartItems(prev =>
      prev.filter(i =>
        i.cartId !== id && i.id !== id && i.item_id !== id && i.event_id !== id
      )
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const ticketItems  = cartItems.filter(i => i.type === 'ticket');
  const productItems = cartItems.filter(i => i.type === 'product');
  const cartTotal    = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const cartCount    = cartItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      ticketItems,
      productItems,
      cartTotal,
      cartCount,
      addTicket,           // ← Concerts.jsx
      addTicketToCart,     // ← other components
      getTicketInCart,     // ← ConcertModal
      addProductToCart,
      updateQuantity,
      removeItem,
      removeFromCart,
      clearCart,
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