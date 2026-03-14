import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PaymentGateway from './PaymentGateway';
import api from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Single cart row ──────────────────────────────────────────────────────────
function CartRow({ item, onUpdateQty, onRemove }) {
  const isTicket  = item.type === 'ticket';
  const maxQty    = isTicket ? 10 : (item.stock || 99);
  const lineTotal = Number(item.price) * item.quantity;

  return (
    <div style={{
      background: '#0F1E38',
      border: `1px solid ${isTicket ? 'rgba(212,168,83,0.2)' : 'rgba(0,191,166,0.2)'}`,
      borderLeft: `3px solid ${isTicket ? '#D4A853' : '#00BFA6'}`,
      borderRadius: '10px', padding: '12px', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Thumbnail */}
        <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0a1628', position: 'relative' }}>
          {(item.banner_image || item.image_url) ? (
            <img
              src={item.banner_image || item.image_url}
              alt={item.event_title || item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '22px' }}>
              {isTicket ? '🎟️' : '🛒'}
            </div>
          )}
          {/* Type badge */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: isTicket ? 'rgba(212,168,83,0.85)' : 'rgba(0,191,166,0.85)', fontSize: '8px', fontWeight: '800', color: '#000', textAlign: 'center', padding: '1px 0', letterSpacing: '0.05em' }}>
            {isTicket ? 'TICKET' : 'ITEM'}
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#EEF2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Exo 2",sans-serif', marginBottom: '2px' }}>
            {isTicket ? item.event_title : item.title}
          </div>
          <div style={{ fontSize: '11px', color: '#4A5A72', marginBottom: '8px', fontFamily: '"Exo 2",sans-serif' }}>
            {isTicket
              ? `${item.tier_label} · ${formatDate(item.event_date)}`
              : item.seller_name || item.category || ''}
          </div>

          {/* Qty + price row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => onUpdateQty(item.cartId, item.quantity - 1)}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: '#EEF2FF', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: 1, fontFamily: '"Exo 2",sans-serif' }}>
                −
              </button>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#EEF2FF', minWidth: '20px', textAlign: 'center', fontFamily: '"Exo 2",sans-serif' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQty(item.cartId, Math.min(item.quantity + 1, maxQty))}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', color: '#EEF2FF', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: 1, fontFamily: '"Exo 2",sans-serif' }}>
                +
              </button>
              {isTicket && (
                <span style={{ fontSize: '10px', color: '#4A5A72', fontFamily: '"Exo 2",sans-serif' }}>
                  max 10
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#4A5A72', fontFamily: '"Exo 2",sans-serif' }}>
                  {item.price === 0 ? '' : `৳${Number(item.price).toLocaleString()} × ${item.quantity}`}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: item.price === 0 ? '#00BFA6' : '#D4A853', fontFamily: '"Cinzel",serif' }}>
                  {item.price === 0 ? 'FREE' : `৳${lineTotal.toLocaleString()}`}
                </div>
              </div>
              <button
                onClick={() => onRemove(item.cartId)}
                style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '6px', color: '#FF5252', cursor: 'pointer', padding: '4px 8px', fontSize: '11px', fontFamily: '"Exo 2",sans-serif' }}>
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Cart sidebar ────────────────────────────────────────────────────────
export default function Cart({ isOpen, onClose }) {
  const { cartItems, ticketItems, productItems, updateQuantity, removeItem, clearCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const [paying, setPaying]       = useState(false);
  const [success, setSuccess]     = useState('');
  const [checkoutErr, setCheckoutErr] = useState('');

  const handleCheckout = () => {
    if (!user) { window.location.href = '/login'; return; }
    if (!cartItems.length) return;
    setCheckoutErr('');
    onClose();
    setPaying(true);
  };

  const handlePaymentSuccess = async (txId) => {
    setPaying(false);
    let errors = [];

    // Save tickets
    for (const item of ticketItems) {
      try {
        await api.post('/tickets/buy', {
          event_id:       item.event_id,
          tier:           item.tier,
          price:          item.price,
          quantity:       item.quantity,
          transaction_id: txId,
        });
      } catch (err) {
        const msg = err?.response?.data?.message || `Ticket error: ${item.event_title}`;
        errors.push(msg);
      }
    }

    // Save product orders
    for (const item of productItems) {
      try {
        await api.post('/marketplace/order', {
          item_id:        item.item_id,
          quantity:       item.quantity,
          transaction_id: txId,
        });
      } catch (err) {
        errors.push(`Order error: ${item.title}`);
      }
    }

    clearCart();

    if (errors.length) {
      setSuccess(`⚠️ Payment done (${txId}) but some items had issues: ${errors.join('; ')}`);
    } else {
      setSuccess(`✅ Order placed! ${ticketItems.length > 0 ? `${ticketItems.reduce((s,i)=>s+i.quantity,0)} ticket(s)` : ''} ${productItems.length > 0 ? `+ ${productItems.length} product(s)` : ''} — TX: ${txId}`);
    }
    setTimeout(() => setSuccess(''), 8000);
  };

  // Build description for PaymentGateway
  const payDescription = [
    ticketItems.length > 0 ? `${ticketItems.reduce((s,i)=>s+i.quantity,0)} concert ticket(s)` : '',
    productItems.length > 0 ? `${productItems.reduce((s,i)=>s+i.quantity,0)} marketplace item(s)` : '',
  ].filter(Boolean).join(' + ');

  return (
    <>
      {paying && (
        <PaymentGateway
          amount={cartTotal}
          itemDescription={payDescription || 'GaanBajna Order'}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPaying(false)}
        />
      )}

      {success && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: '#00BFA6', color: '#000', padding: '14px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', zIndex: 1200, maxWidth: '400px', fontFamily: '"Exo 2",sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', lineHeight: '1.5' }}>
          {success}
        </div>
      )}

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 500 }}
          />

          {/* Sidebar */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '100vw',
            background: '#060D18', borderLeft: '1px solid rgba(255,255,255,0.08)',
            zIndex: 501, display: 'flex', flexDirection: 'column',
            fontFamily: '"Exo 2",sans-serif',
            animation: 'cartSlide 0.25s ease',
          }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🛒</span>
                  <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '18px', color: '#EEF2FF', margin: 0 }}>My Cart</h2>
                  {cartCount > 0 && (
                    <span style={{ background: '#D4A853', color: '#000', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: '800' }}>
                      {cartCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#4A5A72', marginTop: '4px' }}>
                  {ticketItems.length > 0 && `${ticketItems.length} event(s)`}
                  {ticketItems.length > 0 && productItems.length > 0 && ' · '}
                  {productItems.length > 0 && `${productItems.length} product(s)`}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#8B9BB4', cursor: 'pointer', width: '34px', height: '34px', fontSize: '16px' }}>
                ✕
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4A5A72' }}>
                  <div style={{ fontSize: '56px', marginBottom: '14px' }}>🛒</div>
                  <div style={{ fontSize: '16px', color: '#8B9BB4', marginBottom: '8px' }}>Your cart is empty</div>
                  <div style={{ fontSize: '13px' }}>Add concert tickets or marketplace items!</div>
                </div>
              ) : (
                <>
                  {/* Tickets section */}
                  {ticketItems.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#D4A853', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎟️ Concert Tickets
                        <span style={{ background: 'rgba(212,168,83,0.15)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '10px', padding: '1px 8px', fontSize: '10px' }}>
                          {ticketItems.reduce((s, i) => s + i.quantity, 0)} tickets
                        </span>
                      </div>
                      {ticketItems.map(item => (
                        <CartRow
                          key={item.cartId}
                          item={item}
                          onUpdateQty={updateQuantity}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  )}

                  {/* Products section */}
                  {productItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#00BFA6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🛍️ Marketplace Items
                        <span style={{ background: 'rgba(0,191,166,0.1)', border: '1px solid rgba(0,191,166,0.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '10px' }}>
                          {productItems.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                      </div>
                      {productItems.map(item => (
                        <CartRow
                          key={item.cartId}
                          item={item}
                          onUpdateQty={updateQuantity}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '16px 20px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>

                {/* Breakdown */}
                <div style={{ background: '#0A1628', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  {ticketItems.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B9BB4', marginBottom: '6px' }}>
                      <span>🎟️ Tickets ({ticketItems.reduce((s,i)=>s+i.quantity,0)})</span>
                      <span style={{ color: '#D4A853' }}>
                        {ticketItems.every(i => i.price === 0) ? 'FREE' : `৳${ticketItems.reduce((s,i)=>s+Number(i.price)*i.quantity,0).toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {productItems.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8B9BB4', marginBottom: '6px' }}>
                      <span>🛍️ Products ({productItems.reduce((s,i)=>s+i.quantity,0)})</span>
                      <span style={{ color: '#00BFA6' }}>
                        ৳{productItems.reduce((s,i)=>s+Number(i.price)*i.quantity,0).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#EEF2FF' }}>Total</span>
                    <span style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', fontWeight: '700', color: cartTotal === 0 ? '#00BFA6' : '#D4A853' }}>
                      {cartTotal === 0 ? 'FREE' : `৳${cartTotal.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {checkoutErr && (
                  <div style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)', borderRadius: '8px', padding: '10px 12px', color: '#FF5252', fontSize: '12px', marginBottom: '12px' }}>
                    ⚠️ {checkoutErr}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  {cartTotal === 0 ? '🎉 RESERVE ALL FREE TICKETS' : `⚡ CHECKOUT · ৳${cartTotal.toLocaleString()}`}
                </button>

                <button
                  onClick={clearCart}
                  style={{ width: '100%', background: 'none', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '10px', padding: '10px', color: '#FF5252', cursor: 'pointer', fontSize: '13px', fontFamily: '"Exo 2",sans-serif' }}>
                  🗑️ Clear Cart
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes cartSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
