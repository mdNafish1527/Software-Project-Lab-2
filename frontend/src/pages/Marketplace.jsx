import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  'All', 'Books & Notes', 'Electronics', 'Clothing', 'Food & Snacks',
  'Hostel Items', 'Services', 'Art & Crafts', 'Band Merchandise', 'Other',
];

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ item, onViewClick }) {
  const { addProduct, getProductInCart } = useCart();
  const inCart    = getProductInCart(item.id || item.item_id);
  const [flash, setFlash] = useState(false);
  const outOfStock = (item.stock_quantity || item.stock || 0) === 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addProduct({
      id:        item.id || item.item_id,
      title:     item.name || item.title,
      price:     Number(item.price),
      stock:     item.stock_quantity || item.stock || 10,
      image_url: item.photo || item.image_url,
      category:  item.type || item.category,
      seller_name: item.seller_name,
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(145deg,#0F1E38,#122040)',
        border: inCart ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', overflow: 'hidden', transition: 'all 0.25s', cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image */}
      <div onClick={() => onViewClick(item)} style={{ position: 'relative', height: '190px', overflow: 'hidden', background: '#080f1e' }}>
        {(item.photo || item.image_url)
          ? <img src={item.photo || item.image_url} alt={item.name || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onError={e => { e.target.style.display = 'none'; }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '48px' }}>🛒</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,22,40,0.9) 0%,transparent 60%)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#D4A853', fontSize: '11px', padding: '2px 9px', borderRadius: '20px', border: '1px solid rgba(212,168,83,0.3)' }}>
            {item.type || item.category}
          </span>
        </div>
        {inCart && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#00BFA6', color: '#000', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
            ✓ In Cart ×{inCart.quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <h3 onClick={() => onViewClick(item)} style={{ fontSize: '13px', fontWeight: '600', color: '#EEF2FF', marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', fontFamily: '"Exo 2",sans-serif' }}>
          {item.name || item.title}
        </h3>
        {item.seller_name && (
          <div style={{ fontSize: '11px', color: '#4A5A72', marginBottom: '10px' }}>👤 {item.seller_name}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontFamily: '"Cinzel",serif', fontSize: '18px', fontWeight: '700', color: '#D4A853' }}>
            ৳{Number(item.price).toLocaleString()}
          </span>
          <span style={{ fontSize: '11px', color: '#4A5A72' }}>{item.stock_quantity ?? item.stock ?? 0} left</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => onViewClick(item)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#8B9BB4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
            View
          </button>
          <button onClick={handleAdd} disabled={outOfStock}
            style={{
              flex: 2,
              background: outOfStock ? 'rgba(255,255,255,0.03)' : flash ? '#00BFA6' : 'linear-gradient(135deg,#D4A853,#B8922E)',
              color: outOfStock ? '#555' : '#000',
              border: 'none', borderRadius: '8px', padding: '9px',
              fontWeight: '700', fontSize: '12px', cursor: outOfStock ? 'not-allowed' : 'pointer',
              fontFamily: '"Exo 2",sans-serif', transition: 'background 0.2s',
            }}>
            {outOfStock ? 'Out of Stock' : flash ? '✅ Added!' : '🛒 Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onOpenCart }) {
  const [qty, setQty]     = useState(1);
  const [flash, setFlash] = useState(false);
  const { user }          = useAuth();
  const { addProduct, getProductInCart, updateQuantity } = useCart();

  if (!item) return null;

  const stock  = item.stock_quantity ?? item.stock ?? 0;
  const inCart = getProductInCart(item.id || item.item_id);

  const handleAdd = () => {
    const product = {
      id:          item.id || item.item_id,
      title:       item.name || item.title,
      price:       Number(item.price),
      stock:       stock,
      image_url:   item.photo || item.image_url,
      category:    item.type || item.category,
      seller_name: item.seller_name,
    };
    // If already in cart, bump quantity; otherwise add fresh
    if (inCart) {
      updateQuantity(inCart.cartId, inCart.quantity + qty);
    } else {
      for (let i = 0; i < qty; i++) addProduct(product);
    }
    setFlash(true);
    setTimeout(() => { setFlash(false); onClose(); }, 1000);
  };

  const handleAddAndView = () => {
    handleAdd();
    setTimeout(() => onOpenCart(), 1100);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0F1E38', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '16px', maxWidth: '520px', width: '100%', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: '220px', background: '#080f1e' }}>
          {(item.photo || item.image_url) && <img src={item.photo || item.image_url} alt={item.name || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(15,30,56,0.9) 0%,transparent 60%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>

        <div style={{ padding: '24px', fontFamily: '"Exo 2",sans-serif' }}>
          <span style={{ background: 'rgba(212,168,83,0.1)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.25)', fontSize: '11px', padding: '2px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '10px' }}>
            {item.type || item.category}
          </span>
          <h3 style={{ fontFamily: '"Cinzel",serif', fontSize: '18px', color: '#EEF2FF', marginBottom: '10px', lineHeight: '1.4' }}>
            {item.name || item.title}
          </h3>
          {item.description && <p style={{ color: '#8B9BB4', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>{item.description}</p>}

          {[
            { label: 'Seller',    value: item.seller_name },
            { label: 'Stock',     value: `${stock} available` },
            { label: 'Condition', value: item.condition_status },
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <span style={{ color: '#4A5A72' }}>{row.label}</span>
              <span style={{ color: '#EEF2FF' }}>{row.value}</span>
            </div>
          ))}

          <div style={{ fontFamily: '"Cinzel",serif', fontSize: '26px', fontWeight: '700', color: '#D4A853', margin: '18px 0 14px' }}>
            ৳{Number(item.price).toLocaleString()}
          </div>

          {inCart && (
            <div style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#00d4ff', marginBottom: '14px' }}>
              🛒 Already in cart: {inCart.quantity} × ৳{(inCart.price * inCart.quantity).toLocaleString()}
            </div>
          )}

          {!user ? (
            <a href="/login" style={{ display: 'block', background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', borderRadius: '10px', padding: '13px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', textAlign: 'center' }}>
              🔐 Login to Buy
            </a>
          ) : stock > 0 ? (
            <>
              {/* Qty selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', background: '#122040', borderRadius: '10px', padding: '12px 16px' }}>
                <span style={{ color: '#8B9BB4', fontSize: '13px', flex: 1 }}>Quantity</span>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#EEF2FF', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px' }}>−</button>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#EEF2FF', minWidth: '28px', textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(Math.min(10, stock), q + 1))} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#EEF2FF', width: '30px', height: '30px', cursor: 'pointer', fontSize: '16px' }}>+</button>
                <span style={{ color: '#D4A853', fontSize: '14px', fontWeight: '700', fontFamily: '"Cinzel",serif', minWidth: '80px', textAlign: 'right' }}>
                  ৳{(item.price * qty).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAdd}
                  style={{ flex: 1, background: flash ? '#00BFA6' : 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', transition: 'background 0.2s' }}>
                  {flash ? '✅ Added!' : `🛒 ADD TO CART · ৳${(item.price * qty).toLocaleString()}`}
                </button>
                {/* View Cart → opens sidebar */}
                <button onClick={handleAddAndView}
                  style={{ background: 'rgba(212,168,83,0.1)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '10px', padding: '14px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', whiteSpace: 'nowrap' }}>
                  View Cart →
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', color: '#555', fontSize: '14px' }}>❌ Out of Stock</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Marketplace({ onOpenCart }) {
  const { user }       = useAuth();
  const { cartCount }  = useCart();   // ← new API

  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort]             = useState('newest');
  const [minPrice, setMinPrice]     = useState('');
  const [maxPrice, setMaxPrice]     = useState('');
  const [page, setPage]             = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchItems = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12, sort });
      if (selectedCategory !== 'All') params.set('type', selectedCategory);
      if (search)   params.set('search', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      const res = await api.get(`/marketplace?${params}`);
      setItems(res.data.items || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
      setPage(p);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(1); }, [selectedCategory, sort]);

  return (
    <div style={{ minHeight: '100vh', background: '#060D18', color: '#EEF2FF', fontFamily: '"Exo 2",sans-serif' }}>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onOpenCart={onOpenCart}
        />
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0A1628 0%,#0F1E38 100%)', padding: '50px 24px', position: 'relative' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(212,168,83,0.12)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.2)', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>🏛️ UNIVERSITY OF DHAKA</span>
              <span style={{ background: 'rgba(0,191,166,0.1)', color: '#00BFA6', border: '1px solid rgba(0,191,166,0.2)', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>💡 IIT-DU CAMPUS</span>
            </div>
            <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(22px,3.5vw,38px)', fontWeight: '700', color: '#EEF2FF', marginBottom: '10px' }}>
              DU Campus <span style={{ color: '#D4A853' }}>Marketplace</span>
            </h1>
            <p style={{ color: '#8B9BB4', fontSize: '14px', lineHeight: '1.7', maxWidth: '520px' }}>
              Buy and sell within the University of Dhaka community — books, electronics, clothing, band merch and more.
            </p>
          </div>

          {/* Cart button → opens sidebar */}
          <button
            onClick={onOpenCart}
            style={{
              position: 'relative',
              background: cartCount > 0 ? 'linear-gradient(135deg,#D4A853,#B8922E)' : 'rgba(255,255,255,0.07)',
              border: cartCount > 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', padding: '14px 22px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontFamily: '"Exo 2",sans-serif', alignSelf: 'center',
            }}
          >
            <span style={{ fontSize: '22px' }}>🛒</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: cartCount > 0 ? '#000' : '#EEF2FF' }}>My Cart</div>
              <div style={{ fontSize: '11px', color: cartCount > 0 ? '#000' : '#4A5A72' }}>{cartCount} item(s)</div>
            </div>
            {cartCount > 0 && (
              <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#FF5252', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </div>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '7px 16px', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', transition: 'all 0.2s',
                border: selectedCategory === cat ? '1px solid #D4A853' : '1px solid rgba(255,255,255,0.1)',
                background: selectedCategory === cat ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.03)',
                color: selectedCategory === cat ? '#D4A853' : '#8B9BB4',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', flex: '2 1 220px' }}>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (setSearch(searchInput), fetchItems(1))}
              placeholder="Search items..."
              style={{ flex: 1, background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', outline: 'none', fontFamily: '"Exo 2",sans-serif' }} />
            <button onClick={() => { setSearch(searchInput); fetchItems(1); }}
              style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: '700', cursor: 'pointer' }}>🔍</button>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ flex: '1 1 130px', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', outline: 'none', fontFamily: '"Exo 2",sans-serif' }}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} onBlur={() => fetchItems(1)} placeholder="Min ৳"
            style={{ flex: '0 1 80px', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', outline: 'none' }} />
          <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} onBlur={() => fetchItems(1)} placeholder="Max ৳"
            style={{ flex: '0 1 80px', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', outline: 'none' }} />
          <button onClick={() => { setSelectedCategory('All'); setSearch(''); setSearchInput(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); fetchItems(1); }}
            style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '9px 14px', fontSize: '12px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
            ✕ Clear
          </button>
        </div>

        {!loading && (
          <div style={{ color: '#4A5A72', fontSize: '13px', marginBottom: '20px' }}>
            <span style={{ color: '#D4A853', fontWeight: '600' }}>{pagination.total}</span> items
            {selectedCategory !== 'All' && <span> in <span style={{ color: '#D4A853' }}>{selectedCategory}</span></span>}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.07)', borderTopColor: '#D4A853', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: '#4A5A72' }}>Loading marketplace...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#4A5A72' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <div style={{ fontSize: '18px', color: '#8B9BB4', marginBottom: '8px' }}>No items found</div>
            <div>Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '20px' }}>
            {items.map(item => (
              <ProductCard key={item.id || item.item_id} item={item} onViewClick={setSelectedItem} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button disabled={page === 1} onClick={() => fetchItems(page - 1)}
              style={{ background: page === 1 ? 'rgba(255,255,255,0.03)' : '#122040', color: page === 1 ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchItems(p)}
                style={{ background: p === page ? 'linear-gradient(135deg,#D4A853,#B8922E)' : '#122040', color: p === page ? '#000' : '#EEF2FF', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
                {p}
              </button>
            ))}
            <button disabled={page === pagination.pages} onClick={() => fetchItems(page + 1)}
              style={{ background: page === pagination.pages ? 'rgba(255,255,255,0.03)' : '#122040', color: page === pagination.pages ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
