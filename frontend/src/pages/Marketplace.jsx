import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PaymentGateway from '../components/PaymentGateway';

const CATEGORIES = [
  'All','Band Merchandise','Musical Instruments','Books & Notes',
  'Electronics','Clothing','Food & Snacks','Art & Crafts',
  'Services','Hostel Items','Other',
];
const catIcons = {
  'Band Merchandise':'🎸','Musical Instruments':'🎵','Books & Notes':'📚',
  'Electronics':'💻','Clothing':'👕','Food & Snacks':'🍱','Art & Crafts':'🎨',
  'Services':'🛠️','Hostel Items':'🏠','Other':'📦',
};
const conditionColor = {
  New:'#00BFA6','Like New':'#4A9EFF',Good:'#D4A853',Fair:'#FF9800',
};

// ── Delivery Details Modal ────────────────────────────────────────────────────
function DeliveryModal({ item, onConfirm, onCancel }) {
  const [form, setForm] = useState({
    shipping_name: '', shipping_phone: '', shipping_address: '', shipping_note: '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.shipping_name.trim())    return setError('Enter your full name');
    if (!form.shipping_phone.trim())   return setError('Enter your phone number');
    if (!form.shipping_address.trim()) return setError('Enter your delivery address');
    setError('');
    onConfirm(form);
  };

  const iStyle = {
    width:'100%', background:'#122040', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:'8px', padding:'10px 14px', color:'#EEF2FF', fontSize:'13px',
    fontFamily:'"Exo 2",sans-serif', outline:'none', boxSizing:'border-box',
  };
  const lStyle = {
    display:'block', fontSize:'11px', fontWeight:'600', color:'#4A5A72',
    textTransform:'uppercase', letterSpacing:'1px', marginBottom:'5px',
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}
      onClick={onCancel}>
      <div style={{ background:'#0F1E38',border:'1px solid rgba(212,168,83,0.3)',borderTop:'2px solid #D4A853',borderRadius:'16px',maxWidth:'460px',width:'100%',padding:'28px 24px',fontFamily:'"Exo 2",sans-serif' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ marginBottom:'20px' }}>
          <div style={{ fontSize:'10px',color:'#4A5A72',letterSpacing:'0.2em',marginBottom:'6px' }}>STEP 2 OF 2</div>
          <div style={{ fontSize:'18px',fontWeight:'700',color:'#EEF2FF' }}>📦 Delivery Details</div>
          <div style={{ fontSize:'12px',color:'#8B9BB4',marginTop:'4px' }}>Where should we deliver <span style={{ color:'#D4A853' }}>{item?.name}</span>?</div>
        </div>

        {error && (
          <div style={{ background:'rgba(255,60,60,0.1)',border:'1px solid rgba(255,60,60,0.3)',borderRadius:'8px',padding:'10px 14px',color:'#ff6b6b',fontSize:'12px',marginBottom:'14px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom:'14px' }}>
          <label style={lStyle}>Full Name *</label>
          <input style={iStyle} placeholder="e.g. Mohammad Nafis"
            value={form.shipping_name} onChange={e => set('shipping_name', e.target.value)} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lStyle}>Phone Number *</label>
          <input style={iStyle} placeholder="01XXXXXXXXX" type="tel"
            value={form.shipping_phone} onChange={e => set('shipping_phone', e.target.value.replace(/\D/g,'').slice(0,11))} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={lStyle}>Delivery Address *</label>
          <textarea style={{ ...iStyle, resize:'vertical', minHeight:'80px' }}
            placeholder="Room no., Hall name, Building, DU Campus / Full address"
            value={form.shipping_address} onChange={e => set('shipping_address', e.target.value)} />
        </div>

        <div style={{ marginBottom:'20px' }}>
          <label style={lStyle}>Note for Seller (optional)</label>
          <input style={iStyle} placeholder="Any special instructions..."
            value={form.shipping_note} onChange={e => set('shipping_note', e.target.value)} />
        </div>

        <div style={{ display:'flex',gap:'10px' }}>
          <button onClick={onCancel}
            style={{ flex:1,background:'rgba(255,255,255,0.05)',color:'#8B9BB4',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'12px',cursor:'pointer',fontFamily:'"Exo 2",sans-serif',fontSize:'13px' }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            style={{ flex:2,background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',border:'none',borderRadius:'10px',padding:'12px',cursor:'pointer',fontWeight:'700',fontFamily:'"Exo 2",sans-serif',fontSize:'13px' }}>
            ✅ Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Item Detail Modal ─────────────────────────────────────────────────────────
function ItemModal({ item, onBuy, onClose }) {
  if (!item) return null;
  const discount = item.original_price && item.original_price > item.price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px' }}
      onClick={onClose}>
      <div style={{ background:'#0F1E38',border:'1px solid rgba(212,168,83,0.25)',borderRadius:'16px',maxWidth:'520px',width:'100%',overflow:'hidden',maxHeight:'90vh',overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ position:'relative',height:'240px' }}>
          <img src={item.photo} alt={item.name}
            style={{ width:'100%',height:'100%',objectFit:'cover' }}
            onError={e => { e.target.src='https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&auto=format&fit=crop'; }} />
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(15,30,56,0.9) 0%,transparent 60%)' }} />
          <button onClick={onClose} style={{ position:'absolute',top:'12px',right:'12px',background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'50%',width:'32px',height:'32px',color:'#fff',cursor:'pointer',fontSize:'14px' }}>✕</button>
          {item.is_featured==1 && <span style={{ position:'absolute',top:'12px',left:'12px',background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',fontSize:'10px',fontWeight:'700',padding:'3px 10px',borderRadius:'20px' }}>⭐ FEATURED</span>}
          {discount >= 10 && <span style={{ position:'absolute',bottom:'12px',right:'12px',background:'#FF5252',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'20px' }}>{discount}% OFF</span>}
        </div>

        <div style={{ padding:'24px' }}>
          <div style={{ display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap' }}>
            <span style={{ background:'rgba(212,168,83,0.1)',color:'#D4A853',border:'1px solid rgba(212,168,83,0.25)',fontSize:'11px',padding:'2px 10px',borderRadius:'20px' }}>
              {catIcons[item.type]||'📦'} {item.type}
            </span>
            {item.condition_status && (
              <span style={{ background:'rgba(0,0,0,0.3)',color:conditionColor[item.condition_status]||'#888',border:`1px solid ${conditionColor[item.condition_status]||'#888'}40`,fontSize:'11px',padding:'2px 10px',borderRadius:'20px' }}>
                {item.condition_status}
              </span>
            )}
          </div>

          <h3 style={{ fontFamily:'"Cinzel",serif',fontSize:'18px',color:'#EEF2FF',marginBottom:'10px',lineHeight:'1.4' }}>
            {item.name}
          </h3>

          {item.description && (
            <p style={{ color:'#8B9BB4',fontSize:'14px',lineHeight:'1.7',marginBottom:'16px' }}>
              {item.description}
            </p>
          )}

          <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px' }}>
            <span style={{ fontFamily:'"Cinzel",serif',fontSize:'28px',fontWeight:'700',color:'#D4A853' }}>
              ৳{Number(item.price).toLocaleString('en-BD')}
            </span>
            {item.original_price && item.original_price > item.price && (
              <span style={{ fontSize:'16px',color:'#4A5A72',textDecoration:'line-through' }}>
                ৳{Number(item.original_price).toLocaleString('en-BD')}
              </span>
            )}
          </div>

          {(item.seller_name || item.seller_username) && (
            <div style={{ background:'rgba(255,255,255,0.04)',borderRadius:'10px',padding:'12px 14px',marginBottom:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
              {[
                ['Seller',      item.seller_name || item.seller_username],
                ['Department',  item.seller_dept],
                ['Hall',        item.seller_hall],
                ['Contact',     item.seller_contact],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:'10px',color:'#4A5A72',letterSpacing:'0.1em',textTransform:'uppercase' }}>{k}</div>
                  <div style={{ fontSize:'13px',color:'#EEF2FF',marginTop:'2px' }}>{v}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize:'12px',color:'#4A5A72',marginBottom:'20px' }}>
            {item.stock_quantity > 0 ? `✅ ${item.stock_quantity} in stock` : '❌ Out of stock'}
          </div>

          <button onClick={() => onBuy(item)}
            disabled={!item.stock_quantity || item.stock_quantity < 1}
            style={{ width:'100%',background:item.stock_quantity>0?'linear-gradient(135deg,#D4A853,#B8922E)':'rgba(255,255,255,0.06)',color:item.stock_quantity>0?'#000':'#555',border:'none',borderRadius:'10px',padding:'14px',fontWeight:'700',fontSize:'14px',cursor:item.stock_quantity>0?'pointer':'not-allowed',fontFamily:'"Exo 2",sans-serif' }}>
            {item.stock_quantity > 0 ? '⚡ PROCEED TO PAYMENT' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ item, onCardClick }) {
  const discount = item.original_price && item.original_price > item.price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100) : 0;

  return (
    <div onClick={() => onCardClick(item)}
      style={{ background:'linear-gradient(145deg,#0F1E38,#122040)',border:item.is_featured==1?'1px solid rgba(212,168,83,0.35)':'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',overflow:'hidden',transition:'all 0.25s ease',position:'relative',cursor:'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>

      <div style={{ position:'relative',height:'200px',overflow:'hidden' }}>
        <img src={item.photo} alt={item.name}
          style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s ease' }}
          onError={e => { e.target.src='https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&auto=format&fit=crop'; }} />
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,22,40,0.9) 0%,transparent 60%)' }} />
        <div style={{ position:'absolute',top:'10px',left:'10px',display:'flex',gap:'5px',flexWrap:'wrap' }}>
          {item.is_featured==1 && <span style={{ background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px' }}>⭐ FEATURED</span>}
          {discount>=20 && <span style={{ background:'#FF5252',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px' }}>{discount}% OFF</span>}
        </div>
        <div style={{ position:'absolute',top:'10px',right:'10px' }}>
          <span style={{ background:'rgba(0,0,0,0.65)',color:conditionColor[item.condition_status]||'#888',fontSize:'11px',fontWeight:'600',padding:'2px 9px',borderRadius:'20px',backdropFilter:'blur(4px)',border:`1px solid ${conditionColor[item.condition_status]||'#888'}40` }}>
            {item.condition_status||'N/A'}
          </span>
        </div>
        <div style={{ position:'absolute',bottom:'10px',left:'10px' }}>
          <span style={{ background:'rgba(0,0,0,0.65)',color:'#D4A853',fontSize:'11px',padding:'2px 9px',borderRadius:'20px',border:'1px solid rgba(212,168,83,0.3)',backdropFilter:'blur(4px)' }}>
            {catIcons[item.type]||'📦'} {item.type}
          </span>
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        <h3 style={{ fontSize:'14px',fontWeight:'600',color:'#EEF2FF',marginBottom:'8px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',lineHeight:'1.5',fontFamily:'"Exo 2",sans-serif' }}>
          {item.name}
        </h3>
        <div style={{ display:'flex',alignItems:'center',gap:'6px',marginBottom:'12px' }}>
          <div style={{ width:'24px',height:'24px',borderRadius:'50%',background:'linear-gradient(135deg,#00BFA6,#009E88)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700',color:'#fff',flexShrink:0 }}>
            {(item.seller_name||item.seller_username||'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize:'12px',fontWeight:'500',color:'#8B9BB4' }}>{item.seller_name||item.seller_username||'Seller'}</div>
            {item.seller_dept && <div style={{ fontSize:'11px',color:'#4A5A72' }}>{item.seller_dept}</div>}
          </div>
          {item.seller_hall && (
            <div style={{ marginLeft:'auto',fontSize:'10px',color:'#4A5A72',background:'rgba(255,255,255,0.04)',padding:'2px 7px',borderRadius:'10px',whiteSpace:'nowrap' }}>
              {item.seller_hall.split(' ').slice(0,2).join(' ')}
            </div>
          )}
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px' }}>
          <span style={{ fontFamily:'"Cinzel",serif',fontSize:'20px',fontWeight:'700',color:'#D4A853' }}>
            ৳{Number(item.price).toLocaleString('en-BD')}
          </span>
          {item.original_price && item.original_price > item.price && (
            <span style={{ fontSize:'13px',color:'#4A5A72',textDecoration:'line-through' }}>
              ৳{Number(item.original_price).toLocaleString('en-BD')}
            </span>
          )}
        </div>
        <div style={{ width:'100%',background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',borderRadius:'8px',padding:'10px',fontWeight:'700',fontSize:'13px',textAlign:'center',fontFamily:'"Exo 2",sans-serif' }}>
          🛒 View & Buy
        </div>
      </div>
    </div>
  );
}

// ── Main Marketplace ──────────────────────────────────────────────────────────
export default function Marketplace() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [items, setItems]             = useState([]);
  const [featured, setFeatured]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [category, setCategory]       = useState('');
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort]               = useState('newest');
  const [minPrice, setMinPrice]       = useState('');
  const [maxPrice, setMaxPrice]       = useState('');
  const [condition, setCondition]     = useState('');
  const [page, setPage]               = useState(1);
  const [pagination, setPagination]   = useState({});

  // Modal states
  const [selectedItem, setSelectedItem]   = useState(null); // detail modal
  const [payingItem, setPayingItem]       = useState(null); // payment gateway
  const [deliveryItem, setDeliveryItem]   = useState(null); // delivery modal
  const [pendingTxId, setPendingTxId]     = useState(null); // tx held until delivery submitted
  const [toast, setToast]                 = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 5000); };

  useEffect(() => {
    api.get('/marketplace/recommended').then(r => setFeatured(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { loadItems(1); }, [category, search, sort, condition]);

  const loadItems = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12, sort });
      if (category && category !== 'All') params.append('type', category);
      if (search)    params.append('search', search);
      if (condition) params.append('condition', condition);
      if (minPrice)  params.append('min_price', minPrice);
      if (maxPrice)  params.append('max_price', maxPrice);
      const res = await api.get(`/marketplace?${params}`);
      setItems(res.data.items || res.data || []);
      setPagination(res.data.pagination || {});
      setPage(p);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item) => {
    if (!user) { setSelectedItem({ ...item, _loginPrompt: true }); return; }
    setSelectedItem(item);
  };

  // Step 1: open payment gateway
  const handleBuyFromModal = (item) => {
    setSelectedItem(null);
    setPayingItem(item);
  };

  // Step 2: payment done → hold tx, open delivery modal
  const handlePaymentSuccess = (txId) => {
    setPendingTxId(txId);
    setDeliveryItem(payingItem); // save reference before clearing
    setPayingItem(null);
  };

  // Step 3: delivery details submitted → save order to backend
  const handleDeliveryConfirm = async (deliveryForm) => {
    const item = deliveryItem;
    setDeliveryItem(null);
    try {
      await api.post('/marketplace/order', {
        items: [{ item_id: item.id || item.item_id, quantity: 1 }],
        transaction_id:   pendingTxId,
        shipping_name:    deliveryForm.shipping_name,
        shipping_phone:   deliveryForm.shipping_phone,
        shipping_address: deliveryForm.shipping_address,
        shipping_note:    deliveryForm.shipping_note,
      });
      showToast(`✅ Order placed for "${item.name}"! The seller will contact you at ${deliveryForm.shipping_phone}.`);
      loadItems(page);
    } catch (err) {
      showToast(`⚠️ Payment done (${pendingTxId}) but order save failed: ${err.response?.data?.message || 'Contact support'}`);
    }
    setPendingTxId(null);
  };

  const heroItems = featured.length > 0 ? featured : items;

  return (
    <div style={{ minHeight:'100vh',background:'#060D18',color:'#EEF2FF',fontFamily:'"Exo 2",sans-serif' }}>

      {/* Payment Gateway */}
      {payingItem && (
        <PaymentGateway
          amount={Number(payingItem.price)}
          itemDescription={payingItem.name}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPayingItem(null)}
        />
      )}

      {/* Delivery Modal */}
      {deliveryItem && (
        <DeliveryModal
          item={deliveryItem}
          onConfirm={handleDeliveryConfirm}
          onCancel={() => { setDeliveryItem(null); setPendingTxId(null); showToast('⚠️ Payment was completed but order was cancelled. Contact support if charged.'); }}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && !selectedItem._loginPrompt && (
        <ItemModal item={selectedItem} onBuy={handleBuyFromModal} onClose={() => setSelectedItem(null)} />
      )}

      {/* Login Prompt Modal */}
      {selectedItem?._loginPrompt && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }}
          onClick={() => setSelectedItem(null)}>
          <div style={{ background:'#122040',border:'1px solid rgba(212,168,83,0.3)',borderRadius:'16px',padding:'32px',maxWidth:'420px',width:'100%',textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <img src={selectedItem.photo} alt={selectedItem.name}
              style={{ width:'100%',height:'180px',objectFit:'cover',borderRadius:'10px',marginBottom:'16px' }}
              onError={e => { e.target.src='https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&auto=format&fit=crop'; }} />
            <h3 style={{ fontFamily:'"Cinzel",serif',fontSize:'18px',color:'#EEF2FF',marginBottom:'8px' }}>{selectedItem.name}</h3>
            <div style={{ fontFamily:'"Cinzel",serif',fontSize:'24px',color:'#D4A853',fontWeight:'700',marginBottom:'16px' }}>৳{Number(selectedItem.price).toLocaleString('en-BD')}</div>
            <p style={{ color:'#8B9BB4',fontSize:'14px',marginBottom:'24px',lineHeight:'1.6' }}>Login to buy this item and contact the seller.</p>
            <div style={{ display:'flex',gap:'12px' }}>
              <button onClick={() => setSelectedItem(null)} style={{ flex:1,background:'rgba(255,255,255,0.05)',color:'#8B9BB4',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'12px',cursor:'pointer',fontFamily:'"Exo 2",sans-serif',fontSize:'14px' }}>Cancel</button>
              <button onClick={() => navigate('/login')} style={{ flex:2,background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',border:'none',borderRadius:'10px',padding:'12px',cursor:'pointer',fontWeight:'700',fontFamily:'"Exo 2",sans-serif',fontSize:'14px' }}>🔐 Login to Buy</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',top:'80px',right:'24px',background:toast.startsWith('✅')?'#00BFA6':'#FF9800',color:'#000',padding:'14px 20px',borderRadius:'10px',fontWeight:'700',fontSize:'13px',zIndex:999,boxShadow:'0 8px 24px rgba(0,0,0,0.3)',maxWidth:'380px',fontFamily:'"Exo 2",sans-serif' }}>
          {toast}
        </div>
      )}

      {/* Hero */}
      <div style={{ position:'relative',background:'linear-gradient(135deg,#0A1628 0%,#0F1E38 100%)',overflow:'hidden',padding:'60px 24px' }}>
        <div style={{ position:'absolute',top:'-60px',right:'-60px',width:'300px',height:'300px',borderRadius:'50%',background:'rgba(212,168,83,0.06)',pointerEvents:'none' }} />
        <div style={{ maxWidth:'1300px',margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',alignItems:'center' }}>
          <div>
            <div style={{ display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap' }}>
              <span style={{ background:'rgba(212,168,83,0.12)',color:'#D4A853',border:'1px solid rgba(212,168,83,0.2)',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'20px',letterSpacing:'1px' }}>🏛️ UNIVERSITY OF DHAKA</span>
              <span style={{ background:'rgba(0,191,166,0.1)',color:'#00BFA6',border:'1px solid rgba(0,191,166,0.2)',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'20px',letterSpacing:'1px' }}>💡 IIT-DU CAMPUS</span>
            </div>
            <h1 style={{ fontFamily:'"Cinzel",serif',fontSize:'clamp(24px,3.5vw,42px)',fontWeight:'700',lineHeight:'1.25',color:'#EEF2FF',marginBottom:'16px' }}>
              DU Campus<br /><span style={{ color:'#D4A853' }}>Marketplace</span>
            </h1>
            <p style={{ color:'#8B9BB4',fontSize:'15px',lineHeight:'1.7',marginBottom:'24px' }}>
              Buy and sell within the University of Dhaka community — band merchandise, instruments, books, electronics, clothing, food, art and more.
            </p>
            <div style={{ display:'flex',gap:'12px',flexWrap:'wrap' }}>
              <button onClick={() => navigate(user ? '/dashboard' : '/login')}
                style={{ background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',border:'none',borderRadius:'10px',padding:'13px 26px',fontWeight:'800',fontSize:'14px',cursor:'pointer',fontFamily:'"Exo 2",sans-serif' }}>
                {user ? '+ List Your Item' : 'Login to Sell'}
              </button>
              <button onClick={() => document.getElementById('mp-grid')?.scrollIntoView({ behavior:'smooth' })}
                style={{ background:'rgba(255,255,255,0.07)',color:'#EEF2FF',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',padding:'13px 24px',fontWeight:'600',fontSize:'14px',cursor:'pointer',fontFamily:'"Exo 2",sans-serif' }}>
                Browse Items ↓
              </button>
            </div>
          </div>

          {/* Featured preview */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
            {heroItems.slice(0,4).map((item,i) => (
              <div key={item.id||i} onClick={() => handleCardClick(item)}
                style={{ borderRadius:'12px',overflow:'hidden',cursor:'pointer',height:'130px',position:'relative' }}>
                <img src={item.photo} alt={item.name}
                  style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  onError={e => { e.target.src='https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&auto=format&fit=crop'; }} />
                <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(10,22,40,0.9) 0%,transparent 60%)' }} />
                <div style={{ position:'absolute',bottom:'8px',left:'8px',right:'8px' }}>
                  <div style={{ fontSize:'11px',color:'#EEF2FF',fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize:'12px',color:'#D4A853',fontWeight:'700' }}>৳{Number(item.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth:'1300px',margin:'0 auto',padding:'40px 24px' }}>

        {/* Category pills */}
        <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'24px' }}>
          {CATEGORIES.map(cat => {
            const active = cat==='All' ? !category : category===cat;
            return (
              <button key={cat} onClick={() => setCategory(cat==='All' ? '' : cat)}
                style={{ padding:'8px 16px',borderRadius:'24px',fontSize:'13px',cursor:'pointer',transition:'all 0.2s',border:active?'1px solid #D4A853':'1px solid rgba(255,255,255,0.1)',background:active?'rgba(212,168,83,0.12)':'rgba(255,255,255,0.03)',color:active?'#D4A853':'#8B9BB4',fontFamily:'"Exo 2",sans-serif' }}>
                {catIcons[cat]||'📦'} {cat}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div id="mp-grid" style={{ background:'#0A1628',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',padding:'16px 20px',marginBottom:'24px',display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'flex-end' }}>
          <div style={{ flex:'2 1 220px' }}>
            <label style={{ display:'block',fontSize:'11px',fontWeight:'600',color:'#4A5A72',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'5px' }}>Search</label>
            <div style={{ display:'flex',gap:'8px' }}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key==='Enter' && setSearch(searchInput)} placeholder="guitar, notes, tshirt..."
                style={{ flex:1,background:'#122040',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'9px 12px',color:'#EEF2FF',fontSize:'13px',fontFamily:'"Exo 2",sans-serif',outline:'none' }} />
              <button onClick={() => setSearch(searchInput)} style={{ background:'linear-gradient(135deg,#D4A853,#B8922E)',color:'#000',border:'none',borderRadius:'8px',padding:'9px 14px',fontWeight:'700',cursor:'pointer',fontSize:'12px' }}>🔍</button>
            </div>
          </div>
          <div style={{ flex:'1 1 120px' }}>
            <label style={{ display:'block',fontSize:'11px',fontWeight:'600',color:'#4A5A72',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'5px' }}>Sort</label>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ width:'100%',background:'#122040',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'9px 12px',color:'#EEF2FF',fontSize:'13px',fontFamily:'"Exo 2",sans-serif',outline:'none' }}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          <div style={{ flex:'1 1 120px' }}>
            <label style={{ display:'block',fontSize:'11px',fontWeight:'600',color:'#4A5A72',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'5px' }}>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)} style={{ width:'100%',background:'#122040',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'9px 12px',color:'#EEF2FF',fontSize:'13px',fontFamily:'"Exo 2",sans-serif',outline:'none' }}>
              <option value="">All</option><option value="New">New</option><option value="Like New">Like New</option><option value="Good">Good</option><option value="Fair">Fair</option>
            </select>
          </div>
          <div style={{ flex:'1 1 90px' }}>
            <label style={{ display:'block',fontSize:'11px',fontWeight:'600',color:'#4A5A72',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'5px' }}>Min ৳</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} onBlur={() => loadItems(1)} placeholder="0"
              style={{ width:'100%',background:'#122040',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'9px 12px',color:'#EEF2FF',fontSize:'13px',fontFamily:'"Exo 2",sans-serif',outline:'none' }} />
          </div>
          <div style={{ flex:'1 1 90px' }}>
            <label style={{ display:'block',fontSize:'11px',fontWeight:'600',color:'#4A5A72',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'5px' }}>Max ৳</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} onBlur={() => loadItems(1)} placeholder="∞"
              style={{ width:'100%',background:'#122040',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'9px 12px',color:'#EEF2FF',fontSize:'13px',fontFamily:'"Exo 2",sans-serif',outline:'none' }} />
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px' }}>
            <div style={{ color:'#4A5A72',fontSize:'13px' }}>
              <span style={{ color:'#D4A853',fontWeight:'600' }}>{items.length}</span>
              {pagination.total ? <> of <span style={{ color:'#EEF2FF',fontWeight:'600' }}>{pagination.total}</span></> : ''} items
              {category && <> in <span style={{ color:'#D4A853' }}>{category}</span></>}
            </div>
            {!user && (
              <div style={{ fontSize:'12px',color:'#4A5A72',background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)',padding:'6px 12px',borderRadius:'8px' }}>
                💡 <button onClick={() => navigate('/login')} style={{ color:'#D4A853',background:'none',border:'none',cursor:'pointer',fontWeight:'600',fontFamily:'"Exo 2",sans-serif',fontSize:'12px' }}>Login</button> to buy & sell
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:'80px',flexDirection:'column',alignItems:'center',gap:'16px' }}>
            <div style={{ width:'40px',height:'40px',border:'3px solid rgba(255,255,255,0.07)',borderTopColor:'#D4A853',borderRadius:'50%',animation:'spin 0.8s linear infinite' }} />
            <div style={{ color:'#4A5A72' }}>Loading marketplace...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center',padding:'80px',color:'#4A5A72' }}>
            <div style={{ fontSize:'48px',marginBottom:'16px' }}>🛒</div>
            <div style={{ fontSize:'18px',color:'#8B9BB4',marginBottom:'8px' }}>No items found</div>
            <div>Try adjusting your filters</div>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'20px' }}>
            {items.map((item,i) => (
              <ProductCard key={item.id||i} item={item} onCardClick={handleCardClick} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display:'flex',justifyContent:'center',gap:'8px',marginTop:'40px',flexWrap:'wrap' }}>
            <button disabled={page===1} onClick={() => loadItems(page-1)} style={{ background:page===1?'rgba(255,255,255,0.03)':'#122040',color:page===1?'#4A5A72':'#EEF2FF',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'8px 16px',cursor:page===1?'not-allowed':'pointer',fontFamily:'"Exo 2",sans-serif',fontSize:'13px' }}>← Prev</button>
            {Array.from({length:pagination.pages},(_,i)=>i+1).map(p=>(
              <button key={p} onClick={() => loadItems(p)} style={{ background:p===page?'linear-gradient(135deg,#D4A853,#B8922E)':'#122040',color:p===page?'#000':'#EEF2FF',border:p===page?'none':'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'8px 14px',cursor:'pointer',fontWeight:p===page?'700':'400',fontFamily:'"Exo 2",sans-serif',fontSize:'13px' }}>{p}</button>
            ))}
            <button disabled={page===pagination.pages} onClick={() => loadItems(page+1)} style={{ background:page===pagination.pages?'rgba(255,255,255,0.03)':'#122040',color:page===pagination.pages?'#4A5A72':'#EEF2FF',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'8px 16px',cursor:page===pagination.pages?'not-allowed':'pointer',fontFamily:'"Exo 2",sans-serif',fontSize:'13px' }}>Next →</button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}
