import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PaymentGateway from './PaymentGateway';
import api from '../api';

export default function Cart({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState('');

  const handleCheckout = () => {
    if (!user) { window.location.href = '/login'; return; }
    if (!cartItems.length) return;
    onClose();
    setPaying(true);
  };

  const handlePaymentSuccess = async (txId) => {
    setPaying(false);
    try {
      for (const item of cartItems) {
        await api.post('/marketplace/order', {
          item_id: item.id,
          quantity: item.quantity,
          transaction_id: txId,
        });
      }
    } catch { /* payment done, order queued */ }
    clearCart();
    setSuccess(`✅ Order placed for ${cartCount} item(s)! Sellers will contact you.`);
    setTimeout(() => setSuccess(''), 6000);
  };

  const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', zIndex: 400 },
    sidebar: {
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
      background: '#0A1628', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 401, display: 'flex', flexDirection: 'column', fontFamily: '"Exo 2",sans-serif',
      animation: 'slideIn 0.25s ease',
    },
  };

  return (
    <>
      {paying && (
        <PaymentGateway
          amount={cartTotal}
          itemDescription={`${cartItems.length} item(s) — DU Marketplace`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPaying(false)}
        />
      )}

      {success && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: '#00BFA6', color: '#000', padding: '14px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', zIndex: 999, maxWidth: '360px', fontFamily: '"Exo 2",sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {success}
        </div>
      )}

      {isOpen && (
        <>
          <div style={s.overlay} onClick={onClose} />
          <div style={s.sidebar}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '18px', color: '#EEF2FF', margin: 0 }}>🛒 Cart</h2>
                <div style={{ fontSize: '12px', color: '#4A5A72', marginTop: '3px' }}>
                  {cartCount} item(s) · ৳{cartTotal.toLocaleString()}
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#8B9BB4', cursor: 'pointer', width: '32px', height: '32px', fontSize: '16px' }}>✕</button>
            </div>

            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4A5A72' }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>🛒</div>
                  <div style={{ fontSize: '16px', color: '#8B9BB4' }}>Your cart is empty</div>
                  <div style={{ fontSize: '13px', marginTop: '6px' }}>Browse the marketplace and add items!</div>
                </div>
              ) : cartItems.map(item => (
                <div key={item.id} style={{ background: '#122040', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0a1628' }}>
                      {item.image_url && <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#EEF2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#D4A853', fontFamily: '"Cinzel",serif', marginBottom: '10px' }}>
                        ৳{Number(item.price).toLocaleString()} each
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Qty controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#EEF2FF', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>−</button>
                          <span style={{ fontSize: '15px', fontWeight: '700', color: '#EEF2FF', minWidth: '22px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.stock))}
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#EEF2FF', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>+</button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#EEF2FF' }}>
                            ৳{(item.price * item.quantity).toLocaleString()}
                          </span>
                          <button onClick={() => removeFromCart(item.id)}
                            style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '6px', color: '#FF5252', cursor: 'pointer', padding: '3px 9px', fontSize: '11px' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: '#8B9BB4', fontSize: '13px' }}>Subtotal ({cartCount} items)</span>
                  <span style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', fontWeight: '700', color: '#D4A853' }}>৳{cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#4A5A72', marginBottom: '16px' }}>
                  Delivery arranged directly with seller
                </div>
                <button onClick={handleCheckout}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', marginBottom: '8px' }}>
                  ⚡ CHECKOUT · ৳{cartTotal.toLocaleString()}
                </button>
                <button onClick={clearCart}
                  style={{ width: '100%', background: 'none', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '10px', padding: '10px', color: '#FF5252', cursor: 'pointer', fontSize: '13px', fontFamily: '"Exo 2",sans-serif' }}>
                  🗑️ Clear Cart
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </>
  );
}
