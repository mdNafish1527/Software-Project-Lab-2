import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All', 'Books & Notes', 'Electronics', 'Clothing', 'Food & Snacks',
  'Stationery', 'Sports', 'Art & Crafts', 'Services', 'Hostel Items', 'Other',
];

const catIcons = {
  'Books & Notes': '📚', 'Electronics': '💻', 'Clothing': '👕',
  'Food & Snacks': '🍱', 'Stationery': '✏️', 'Sports': '🏏',
  'Art & Crafts': '🎨', 'Services': '🛠️', 'Hostel Items': '🏠', 'Other': '📦',
};

const conditionColor = { New: '#00BFA6', 'Like New': '#4A9EFF', Good: '#D4A853', Fair: '#FF9800' };

function ProductCard({ item, onBuyClick }) {
  const discount = item.original_price && item.original_price > item.price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
    : 0;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F1E38, #122040)',
      border: item.is_featured ? '1px solid rgba(212,168,83,0.35)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px', overflow: 'hidden', transition: 'all 0.25s ease', position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img src={item.image_url} alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.9) 0%, transparent 60%)' }} />

        {/* Badges */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {item.is_featured && (
            <span style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>⭐ FEATURED</span>
          )}
          {discount >= 20 && (
            <span style={{ background: '#FF5252', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>{discount}% OFF</span>
          )}
        </div>

        {/* Condition */}
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: conditionColor[item.condition_status] || '#888', fontSize: '11px', fontWeight: '600', padding: '2px 9px', borderRadius: '20px', backdropFilter: 'blur(4px)', border: `1px solid ${conditionColor[item.condition_status] || '#888'}40` }}>
            {item.condition_status}
          </span>
        </div>

        {/* Category bottom */}
        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#D4A853', fontSize: '11px', padding: '2px 9px', borderRadius: '20px', border: '1px solid rgba(212,168,83,0.3)', backdropFilter: 'blur(4px)' }}>
            {catIcons[item.category]} {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#EEF2FF', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', fontFamily: '"Exo 2", sans-serif' }}>
          {item.title}
        </h3>

        {/* Seller info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA6,#009E88)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
            {item.seller_name?.charAt(0) || 'S'}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#8B9BB4' }}>{item.seller_name}</div>
            {item.seller_dept && <div style={{ fontSize: '11px', color: '#4A5A72' }}>{item.seller_dept}</div>}
          </div>
          {item.seller_hall && (
            <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#4A5A72', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
              {item.seller_hall.split(' ').slice(0, 2).join(' ')}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontFamily: '"Cinzel",serif', fontSize: '20px', fontWeight: '700', color: '#D4A853' }}>
            ৳{item.price.toLocaleString('en-BD')}
          </span>
          {item.original_price && item.original_price > item.price && (
            <span style={{ fontSize: '13px', color: '#4A5A72', textDecoration: 'line-through' }}>
              ৳{item.original_price.toLocaleString('en-BD')}
            </span>
          )}
          {discount >= 10 && (
            <span style={{ fontSize: '12px', color: '#00BFA6', fontWeight: '600' }}>Save ৳{(item.original_price - item.price).toLocaleString()}</span>
          )}
        </div>

        {/* Action */}
        <button
          onClick={() => onBuyClick(item)}
          style={{
            width: '100%', background: 'linear-gradient(135deg,#D4A853,#B8922E)',
            color: '#000', border: 'none', borderRadius: '8px', padding: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif',
          }}>
          🛒 View & Buy
        </button>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [cart, setCart] = useState([]);
  const [showCartBanner, setShowCartBanner] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    api.get('/marketplace/featured').then(r => setFeatured(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadItems(1);
  }, [category, search, sort, condition]);

  const loadItems = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12, sort });
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      if (condition) params.append('condition', condition);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      const res = await api.get(`/marketplace?${params}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (item) => {
    if (!user) {
      setSelectedItem(item);
    } else {
      navigate(`/marketplace/${item.id}`);
    }
  };

  const addToCart = (item) => {
    setCart(c => [...c, item]);
    setShowCartBanner(true);
    setTimeout(() => setShowCartBanner(false), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060D18', color: '#EEF2FF', fontFamily: '"Exo 2", sans-serif' }}>

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0A1628 0%, #0F1E38 100%)', overflow: 'hidden', padding: '60px 24px' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(212,168,83,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(0,191,166,0.05)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(212,168,83,0.12)', color: '#D4A853', border: '1px solid rgba(212,168,83,0.2)', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px' }}>🏛️ UNIVERSITY OF DHAKA</span>
              <span style={{ background: 'rgba(0,191,166,0.1)', color: '#00BFA6', border: '1px solid rgba(0,191,166,0.2)', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px' }}>💡 IIT-DU CAMPUS</span>
            </div>
            <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: '700', lineHeight: '1.25', color: '#EEF2FF', marginBottom: '16px' }}>
              DU Campus<br /><span style={{ color: '#D4A853' }}>Marketplace</span>
            </h1>
            <p style={{ color: '#8B9BB4', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
              Buy and sell within the University of Dhaka community — books, electronics, clothing, food, art and more. Trusted student-to-student commerce at IIT-DU and DU campus.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {user ? (
                <button onClick={() => navigate('/marketplace/sell')}
                  style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px 26px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  + List Your Item
                </button>
              ) : (
                <button onClick={() => navigate('/login')}
                  style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px 26px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  Login to Sell
                </button>
              )}
              <button onClick={() => document.getElementById('mp-grid')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'rgba(255,255,255,0.07)', color: '#EEF2FF', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '13px 24px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                Browse Items ↓
              </button>
            </div>
          </div>

          {/* Featured grid preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {featured.slice(0, 4).map((item) => (
              <div key={item.id}
                onClick={() => handleBuyClick(item)}
                style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', height: '130px', position: 'relative' }}
              >
                <img src={item.image_url} alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.9) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#EEF2FF', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#D4A853', fontWeight: '700' }}>৳{item.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart notification */}
      {showCartBanner && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: '#00BFA6', color: '#000', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,191,166,0.3)', fontFamily: '"Exo 2",sans-serif' }}>
          ✅ Added to cart! ({cart.length} item{cart.length > 1 ? 's' : ''})
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              style={{
                padding: '8px 16px', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                border: (category === cat || (!category && cat === 'All')) ? '1px solid #D4A853' : '1px solid rgba(255,255,255,0.1)',
                background: (category === cat || (!category && cat === 'All')) ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.03)',
                color: (category === cat || (!category && cat === 'All')) ? '#D4A853' : '#8B9BB4',
                fontFamily: '"Exo 2",sans-serif',
              }}>
              {catIcons[cat] || '📦'} {cat}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div id="mp-grid" style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 220px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Search</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="books, laptop, notes..."
                style={{ flex: 1, background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }} />
              <button onClick={() => setSearch(searchInput)}
                style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '8px', padding: '9px 14px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', fontFamily: '"Exo 2",sans-serif' }}>
                🔍
              </button>
            </div>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Sort By</label>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="featured">Featured First</option>
            </select>
          </div>

          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}
              style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}>
              <option value="">All</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
            </select>
          </div>

          <div style={{ flex: '1 1 100px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Min ৳</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              onBlur={() => loadItems(1)} placeholder="0"
              style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }} />
          </div>

          <div style={{ flex: '1 1 100px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Max ৳</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              onBlur={() => loadItems(1)} placeholder="∞"
              style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '9px 12px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }} />
          </div>
        </div>

        {/* Results header */}
        {!loading && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ color: '#4A5A72', fontSize: '13px' }}>
              Showing <span style={{ color: '#D4A853', fontWeight: '600' }}>{items.length}</span> of <span style={{ color: '#EEF2FF', fontWeight: '600' }}>{pagination.total || 0}</span> items
              {category && <span> in <span style={{ color: '#D4A853' }}>{category}</span></span>}
            </div>
            {!user && (
              <div style={{ fontSize: '12px', color: '#4A5A72', background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.15)', padding: '6px 12px', borderRadius: '8px' }}>
                💡 <button onClick={() => navigate('/login')} style={{ color: '#D4A853', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontFamily: '"Exo 2",sans-serif', fontSize: '12px' }}>Login</button> to buy, sell & contact sellers
              </div>
            )}
          </div>
        )}

        {/* Product Grid */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {items.map(item => (
              <ProductCard key={item.id} item={item} onBuyClick={handleBuyClick} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button disabled={page === 1} onClick={() => loadItems(page - 1)}
              style={{ background: page === 1 ? 'rgba(255,255,255,0.03)' : '#122040', color: page === 1 ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => loadItems(p)}
                style={{ background: p === page ? 'linear-gradient(135deg,#D4A853,#B8922E)' : '#122040', color: p === page ? '#000' : '#EEF2FF', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: p === page ? '700' : '400', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
                {p}
              </button>
            ))}
            <button disabled={page === pagination.pages} onClick={() => loadItems(page + 1)}
              style={{ background: page === pagination.pages ? 'rgba(255,255,255,0.03)' : '#122040', color: page === pagination.pages ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Login prompt modal */}
      {selectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setSelectedItem(null)}>
          <div style={{ background: '#122040', border: '1px solid rgba(212,168,83,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <img src={selectedItem.image_url} alt={selectedItem.title}
              style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '16px' }} />
            <h3 style={{ fontFamily: '"Cinzel",serif', fontSize: '18px', color: '#EEF2FF', marginBottom: '8px' }}>{selectedItem.title}</h3>
            <div style={{ fontFamily: '"Cinzel",serif', fontSize: '24px', color: '#D4A853', fontWeight: '700', marginBottom: '16px' }}>৳{selectedItem.price.toLocaleString('en-BD')}</div>
            <p style={{ color: '#8B9BB4', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Login or create an account to contact the seller and place your order.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSelectedItem(null)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#8B9BB4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={() => navigate('/login')}
                style={{ flex: 2, background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: '"Exo 2",sans-serif', fontSize: '14px' }}>
                🔐 Login to Buy
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
