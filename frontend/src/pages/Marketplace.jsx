import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [shippingForm, setShippingForm] = useState({ shipping_name: '', shipping_address: '', shipping_phone: '' });
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    fetchItems();
    if (user) fetchRecommended();
  }, []);

  const fetchItems = (q = '') => {
    setLoading(true);
    API.get('/marketplace', { params: { search: q } })
      .then(r => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchRecommended = () => {
    API.get('/marketplace/recommended')
      .then(r => setRecommended(r.data))
      .catch(() => {});
  };

  const addToCart = (item) => {
    if (!user) return navigate('/login');
    setCart(prev => {
      const existing = prev.find(c => c.item_id === item.item_id);
      if (existing) {
        return prev.map(c => c.item_id === item.item_id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart!`);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setOrdering(true);
    try {
      const orderItems = cart.map(c => ({ item_id: c.item_id, quantity: c.quantity }));
      const res = await API.post('/marketplace/order', { items: orderItems, ...shippingForm });
      toast.success(`Order #${res.data.order_id} placed! Total: ৳${res.data.total}`);
      setCart([]);
      setShowCart(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <h1 className="section-title">Marketplace</h1>
            <p className="section-sub" style={{ marginBottom: 0 }}>Merch from your favourite artists</p>
          </div>
          {cart.length > 0 && (
            <button className="btn btn-primary" onClick={() => setShowCart(true)}>
              🛒 Cart ({cart.length}) — ৳{cartTotal.toFixed(2)}
            </button>
          )}
        </div>

        {/* Recommended */}
        {user && recommended.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ marginBottom: 16 }}>⭐ Recommended For You</h3>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {recommended.map(item => (
                <ItemCard key={item.item_id} item={item} onAdd={addToCart} compact />
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={e => { e.preventDefault(); fetchItems(search); }} className="search-bar">
          <input className="form-control" placeholder="Search merchandise..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="spinner" />
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛍️</div>
            <h3>No items found</h3>
          </div>
        ) : (
          <div className="grid grid-4">
            {items.map(item => (
              <ItemCard key={item.item_id} item={item} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 2000, padding: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🛒 Your Cart</h3>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {cart.map(item => (
                <div key={item.item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{item.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>৳{item.price} × {item.quantity}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>৳{(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => setCart(prev => prev.filter(c => c.item_id !== item.item_id))}
                      style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                </div>
              ))}

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal + Shipping (৳60)</span>
                <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.1rem' }}>৳{(cartTotal + 60).toFixed(2)}</span>
              </div>

              <h4 style={{ marginBottom: 16 }}>Shipping Details</h4>
              <form onSubmit={handleOrder}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={shippingForm.shipping_name}
                    onChange={e => setShippingForm({ ...shippingForm, shipping_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea className="form-control" rows={2} value={shippingForm.shipping_address}
                    onChange={e => setShippingForm({ ...shippingForm, shipping_address: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={shippingForm.shipping_phone}
                    onChange={e => setShippingForm({ ...shippingForm, shipping_phone: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={ordering}>
                  {ordering ? 'Placing Order...' : '✅ Confirm & Pay'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemCard = ({ item, onAdd, compact }) => (
  <div className="card" style={compact ? { minWidth: 180, flex: '0 0 auto' } : {}}>
    <div style={{ height: compact ? 120 : 180, background: item.photo ? `url(${item.photo}) center/cover` : 'var(--bg3)', borderRadius: '8px 8px 0 0' }} />
    <div className="card-body">
      <h4 style={{ fontSize: compact ? '0.9rem' : '1rem', marginBottom: 4 }}>{item.name}</h4>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>by {item.seller_name}</p>
      {item.event_title && <p style={{ color: 'var(--gold)', fontSize: 11, marginBottom: 6 }}>🎵 {item.event_title}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>৳{item.price}</span>
        <button className="btn btn-primary btn-sm" onClick={() => onAdd(item)}>+ Cart</button>
      </div>
    </div>
  </div>
);

export default Marketplace;