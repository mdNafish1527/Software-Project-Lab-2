import { createContext, useContext, useState, useEffect } from 'react';

// ─── Cart item shapes ──────────────────────────────────────────────────────────
// Ticket:  { type:'ticket',  cartId:'ticket-{eventId}-{tierLabel}',
//            event_id, event_title, venue, event_date,
//            tier(number), tier_label, price, quantity, banner_image }
// Product: { type:'product', cartId:'product-{itemId}',
//            item_id, title, price, quantity, stock, image_url, seller_name }

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gb_cart_v2') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('gb_cart_v2', JSON.stringify(cartItems));
  }, [cartItems]);

  // ── Add ticket ─────────────────────────────────────────────────────────────
  const addTicket = (event, tier, quantity = 1) => {
    const cartId = `ticket-${event.id}-${tier.label}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, 10);
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i);
      }
      return [...prev, {
        type:         'ticket',
        cartId,
        event_id:     event.id,
        event_title:  event.title,
        venue:        event.venue,
        event_date:   event.event_date,
        tier:         tier.label === 'Tier 1' ? 1 : tier.label === 'Tier 2' ? 2 : 3,
        tier_label:   tier.label,
        price:        tier.price,
        quantity:     Math.min(quantity, 10),
        banner_image: event.banner_image,
      }];
    });
  };

  // ── Add product ────────────────────────────────────────────────────────────
  const addProduct = (item, quantity = 1) => {
    const cartId = `product-${item.id}`;
    setCartItems(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, item.stock);
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: newQty } : i);
      }
      return [...prev, {
        type:        'product',
        cartId,
        item_id:     item.id,
        title:       item.title,
        price:       item.price,
        quantity:    Math.min(quantity, item.stock),
        stock:       item.stock,
        image_url:   item.image_url,
        seller_name: item.seller_name,
        category:    item.category,
      }];
    });
  };

  // ── Update / remove ────────────────────────────────────────────────────────
  const removeItem = (cartId) =>
    setCartItems(prev => prev.filter(i => i.cartId !== cartId));

  const updateQuantity = (cartId, qty) => {
    if (qty <= 0) { removeItem(cartId); return; }
    setCartItems(prev => prev.map(i => {
      if (i.cartId !== cartId) return i;
      const max = i.type === 'ticket' ? 10 : (i.stock || 99);
      return { ...i, quantity: Math.min(qty, max) };
    }));
  };

  const clearCart = () => setCartItems([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const ticketItems  = cartItems.filter(i => i.type === 'ticket');
  const productItems = cartItems.filter(i => i.type === 'product');
  const cartCount    = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal    = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const getTicketInCart  = (eventId, tierLabel) =>
    cartItems.find(i => i.cartId === `ticket-${eventId}-${tierLabel}`);
  const getProductInCart = (itemId) =>
    cartItems.find(i => i.cartId === `product-${itemId}`);

  return (
    <CartContext.Provider value={{
      cartItems, ticketItems, productItems,
      addTicket, addProduct,
      updateQuantity, removeItem, clearCart,
      cartCount, cartTotal,
      getTicketInCart, getProductInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
