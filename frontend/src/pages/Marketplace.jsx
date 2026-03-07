import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    api.get('/marketplace')
      .then(res => setItems(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()))
    : items;

  const addToCart = item => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    setAlert({ type: 'success', text: `${item.name} added to cart` });
    setTimeout(() => setAlert(null), 2000);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Artist & Organizer Store
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '26px', color: 'var(--green)',
              letterSpacing: '0.08em', textShadow: 'var(--green-glow)'
            }}>
              MARKETPLACE
            </h1>
            <button className="btn btn-primary" onClick={() => setCartOpen(!cartOpen)}>
              🛒 CART ({cartCount})
            </button>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

        {/* Cart Drawer */}
        {cartOpen && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px'
          }}>
            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '14px'
            }}>
              Shopping Cart
            </div>
            {cart.length === 0 ? (
              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                Cart is empty
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} className="flex-between" style={{ padding: '10px 0', borderBottom: 'var(--border-dim)' }}>
                    <span style={{ fontFamily: 'var(--text-body)', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {item.name} × {item.qty}
                    </span>
                    <span style={{ fontFamily: 'var(--text-mono)', color: 'var(--gold)' }}>
                      ৳{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex-between" style={{ marginTop: '12px' }}>
                  <span style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL</span>
                  <span style={{ fontFamily: 'var(--text-display)', fontSize: '18px', color: 'var(--gold)', textShadow: 'var(--gold-glow)' }}>
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>
                <button className="btn btn-solid-gold btn-block" style={{ marginTop: '14px' }}>
                  ⚡ CHECKOUT
                </button>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <input
          className="form-control"
          placeholder="Search merchandise..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px', marginBottom: '20px', display: 'block' }}
        />

        {/* Items Grid */}
        {loading ? (
          <div className="flex-center" style={{ padding: '80px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="product-grid">
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-icon">🛒</div>
                <div className="empty-title">NO ITEMS FOUND</div>
                <div className="empty-sub">Check back later for merchandise</div>
              </div>
            ) : (
              filtered.map(item => (
                <div key={item.id} className="product-card">
                  <div className="product-image">🎵</div>
                  <div className="product-body">
                    <div className="product-name">{item.name}</div>
                    {item.description && (
                      <div style={{
                        fontFamily: 'var(--text-body)', fontSize: '12px',
                        color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5
                      }}>
                        {item.description}
                      </div>
                    )}
                    <div className="flex-between" style={{ marginTop: '10px' }}>
                      <div className="product-price">৳{item.price?.toLocaleString()}</div>
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(item)}>
                        + ADD
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
