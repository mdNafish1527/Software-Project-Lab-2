import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api';

const TIER_NAMES = { 1: 'Standing', 2: 'Chair', 3: 'Sofa' };
const TIER_FULL  = { 1: 'Standing — General', 2: 'Chair — Reserved', 3: 'Sofa — VIP' };
const TIER_COLOR = { 1: 'var(--gold)', 2: 'var(--cyan)', 3: '#b040ff' };

const REASON_META = {
  last_chance:     { label: '🔥 LAST CHANCE',     color: '#ff3c3c', bg: 'rgba(255,60,60,0.12)',   border: 'rgba(255,60,60,0.4)'   },
  almost_sold_out: { label: '⚡ ALMOST GONE',      color: '#ff6b00', bg: 'rgba(255,107,0,0.1)',    border: 'rgba(255,107,0,0.4)'   },
  high_demand:     { label: '📈 HIGH DEMAND',      color: '#ffb300', bg: 'rgba(255,179,0,0.1)',    border: 'rgba(255,179,0,0.4)'   },
  selling_fast:    { label: '🚀 SELLING FAST',     color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.35)'  },
  elevated:        { label: '↑ IN DEMAND',         color: '#b040ff', bg: 'rgba(176,64,255,0.08)',  border: 'rgba(176,64,255,0.3)'  },
  standard:        { label: '✓ STANDARD PRICE',    color: '#00c878', bg: 'rgba(0,200,120,0.07)',   border: 'rgba(0,200,120,0.25)'  },
  off:             { label: null, color: null, bg: null, border: null },
  inactive:        { label: null, color: null, bg: null, border: null },
};

// ── Adapter: converts /pricing/event/:id response → internal dynamicData shape ──
function adaptPricingResponse(raw) {
  if (!raw?.tiers) return null;

  const tiersArray = [1, 2, 3]
    .filter(n => raw.tiers[`tier${n}`] != null)
    .map(n => {
      const t = raw.tiers[`tier${n}`];
      // compute multiplier from percentChange
      const mult = t.priceChange === 'increased' ? 1 + (t.percentChange || 0) / 100
                 : t.priceChange === 'decreased' ? 1 - (t.percentChange || 0) / 100
                 : 1.0;
      // pick a reason label
      const demandRate = t.demandRate || 0;
      const reason = t.priceChange === 'increased'
        ? (demandRate > 0.85 ? 'last_chance' : demandRate > 0.7 ? 'almost_sold_out' : demandRate > 0.5 ? 'high_demand' : 'selling_fast')
        : t.priceChange === 'stable' ? 'standard'
        : 'off';

      return {
        tier:       n,
        price:      t.dynamicPrice,
        multiplier: mult,
        reason,
        factors: {
          scarcity:  demandRate,
          velocity:  0,
          urgency:   0,
          occupancy: demandRate,
        },
        remaining: t.remaining ?? null,
      };
    });

  const anySurge = tiersArray.some(t => t.multiplier > 1.05);

  return {
    dynamic_enabled: anySurge,
    tiers:           tiersArray,
    computed_at:     raw.generated_at,
  };
}

function AnimatedPrice({ price, prev, color }) {
  const [flash, setFlash] = useState(false);
  const [dir,   setDir]   = useState(null);

  useEffect(() => {
    if (prev !== null && prev !== price) {
      setDir(price > prev ? 'up' : 'down');
      setFlash(true);
      const t = setTimeout(() => { setFlash(false); setDir(null); }, 900);
      return () => clearTimeout(t);
    }
  }, [price, prev]);

  const flashColor = dir === 'up' ? '#ff5050' : '#00c878';

  return (
    <div style={{
      fontFamily: 'var(--text-display)', fontSize: '26px',
      color: flash ? flashColor : (color || 'var(--gold)'),
      textShadow: flash ? `0 0 16px ${flashColor}` : 'var(--gold-glow)',
      transition: 'color 0.3s, text-shadow 0.3s',
      display: 'flex', alignItems: 'center', gap: '6px',
    }}>
      ৳{price.toLocaleString()}
      {dir === 'up'   && <span style={{ fontSize: '14px', color: '#ff5050' }}>▲</span>}
      {dir === 'down' && <span style={{ fontSize: '14px', color: '#00c878' }}>▼</span>}
    </div>
  );
}

function FactorBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontFamily: 'var(--text-mono)', fontSize: '9px', color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function DynamicTierCard({ tier, dynamicData, basePrice, tierQty, onQtyChange, onAddToCart, inCart, isAdded }) {
  const [showFactors, setShowFactors] = useState(false);
  const prevPrice = useRef(null);

  const dp      = dynamicData;
  const price   = dp ? dp.price : basePrice;
  const mult    = dp ? dp.multiplier : 1.0;
  const reason  = dp ? dp.reason : 'off';
  const meta    = REASON_META[reason] || REASON_META.standard;
  const isSurge = mult > 1.05 && reason !== 'off';
  const factors = dp?.factors || {};
  const color   = TIER_COLOR[tier.tierNum];

  useEffect(() => { prevPrice.current = price; });
  const prev = prevPrice.current;

  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '16px',
      border: inCart > 0 ? '1px solid rgba(0,212,255,0.3)' : isSurge ? `1px solid ${meta.border}` : 'var(--border-dim)',
      transition: 'border-color 0.4s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '4px' }}>
            {tier.name}
          </div>
          <AnimatedPrice price={price} prev={prev !== price ? prev : null} color={color} />
          {isSurge && (
            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
              base ৳{basePrice.toLocaleString()} · <span style={{ color: meta.color }}>{mult.toFixed(2)}×</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {meta.label && (
            <div style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: '20px', padding: '3px 9px', fontFamily: 'var(--text-mono)', fontSize: '9px', fontWeight: '700', color: meta.color, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {meta.label}
            </div>
          )}
          {inCart > 0 && (
            <span style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--cyan)', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '20px', padding: '2px 8px' }}>
              🛒 {inCart} in cart
            </span>
          )}
        </div>
      </div>

      {isSurge && dp && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setShowFactors(f => !f)}
            style={{ background: 'none', border: 'none', fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)', cursor: 'pointer', padding: 0, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {showFactors ? '▾' : '▸'} WHY THIS PRICE?
          </button>
          {showFactors && (
            <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', padding: '12px' }}>
              <FactorBar label="SCARCITY"     value={factors.scarcity || 0} max={1.2} color="#ff6b00" />
              <FactorBar label="DEMAND SPEED" value={factors.velocity || 0} max={0.6} color="#00d4ff" />
              <FactorBar label="TIME URGENCY" value={factors.urgency  || 0} max={0.5} color="#b040ff" />
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)', lineHeight: 1.8 }}>
                <div>{Math.round((factors.occupancy || 0) * 100)}% of seats sold</div>
                {dp.remaining != null && <div>{dp.remaining} seats remaining</div>}
                <div style={{ marginTop: '4px', color: 'var(--text-dim)', opacity: 0.6, fontSize: '8px' }}>
                  Prices refresh automatically · Algorithm: Aerodynamic Demand Pricing
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => onQtyChange(Math.max(1, tierQty - 1))}
          style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px' }}>−</button>
        <input type="number" min={1} max={10} value={tierQty}
          onChange={e => onQtyChange(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
          style={{ width: '44px', textAlign: 'center', background: 'var(--bg-primary,#040810)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-primary)', padding: '5px', fontSize: '14px', fontWeight: '600', outline: 'none' }} />
        <button onClick={() => onQtyChange(Math.min(10, tierQty + 1))}
          style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '16px' }}>+</button>
        <button onClick={onAddToCart}
          style={{ flex: 1, background: isAdded ? '#00BFA6' : `linear-gradient(135deg,${color}cc,${color}88)`, color: '#000', border: 'none', borderRadius: '8px', padding: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--text-mono)', letterSpacing: '0.05em', transition: 'background 0.2s' }}>
          {isAdded ? '✅ Added!' : '+ ADD TO CART'}
        </button>
      </div>
      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px' }}>
        Subtotal: ৳{(tierQty * price).toLocaleString()} · max 10
      </div>
    </div>
  );
}

function ComplaintBox({ eventId, hasTicket }) {
  const fileRef                     = useRef();
  const [text, setText]             = useState('');
  const [files, setFiles]           = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  const handleFiles = (e) => {
    const added = Array.from(e.target.files).map(f => {
      const type    = f.type.startsWith('image') ? 'image' : f.type.startsWith('audio') ? 'audio' : f.type.startsWith('video') ? 'video' : 'file';
      const preview = type === 'image' ? URL.createObjectURL(f) : null;
      return { file: f, preview, type, name: f.name, size: f.size };
    });
    setFiles(prev => [...prev, ...added].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => {
      const next = [...prev];
      if (next[idx].preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) { setError('Please write a description or attach at least one file.'); return; }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('event_id', eventId);
      if (text.trim()) fd.append('text_content', text.trim());
      files.forEach(f => fd.append('files', f.file));
      await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true); setText(''); setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (!hasTicket) return (
    <div style={{ background: 'rgba(212,168,83,0.06)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 'var(--radius-sm)', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎟️</div>
      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--gold)', lineHeight: 1.6 }}>
        You need a ticket for this event to submit a complaint.<br />
        <span style={{ color: 'var(--text-dim)' }}>Purchase a ticket first, then come back here.</span>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={{ background: 'rgba(0,191,166,0.07)', border: '1px solid rgba(0,191,166,0.25)', borderRadius: 'var(--radius-sm)', padding: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
      <div style={{ fontFamily: 'var(--text-display)', fontSize: '16px', color: 'var(--cyan)', marginBottom: '8px' }}>Complaint Submitted</div>
      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '20px', lineHeight: 1.7 }}>
        Your complaint has been forwarded to the event organizer and system admin.<br />
        You can track its status from your dashboard.
      </div>
      <button onClick={() => setSubmitted(false)}
        style={{ background: 'none', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', color: 'var(--cyan)', padding: '8px 20px', cursor: 'pointer', fontFamily: 'var(--text-mono)', fontSize: '12px' }}>
        Submit Another
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '18px', lineHeight: 1.7, padding: '10px 14px', background: 'rgba(255,82,82,0.04)', border: '1px solid rgba(255,82,82,0.12)', borderRadius: '8px' }}>
        ℹ️ Complaints are visible to the <span style={{ color: '#FF5252' }}>event organizer</span> and <span style={{ color: '#FF5252' }}>system admin</span>.
      </div>
      {error && (
        <div style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#FF5252', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>
      )}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={5} placeholder="Describe your issue..."
          value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label className="form-label">Attachments <span style={{ color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0, fontWeight: 400, marginLeft: '6px' }}>up to 5 · images, audio, video</span></label>
        <input ref={fileRef} type="file" multiple accept="image/*,audio/*,video/*" onChange={handleFiles} style={{ display: 'none' }} />
        <div onClick={() => fileRef.current.click()}
          style={{ border: '1.5px dashed rgba(0,212,255,0.22)', borderRadius: '10px', padding: '22px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,212,255,0.02)' }}>
          <div style={{ fontSize: '30px', marginBottom: '7px' }}>📎</div>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>Click to attach files</div>
        </div>
      </div>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {files.map((f, i) => (
            <div key={i} style={{ position: 'relative', background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: '8px', overflow: 'hidden', width: '140px' }}>
              {f.type === 'image' && f.preview
                ? <img src={f.preview} alt={f.name} style={{ width: '140px', height: '90px', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '140px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '30px' }}>{f.type === 'audio' ? '🎵' : f.type === 'video' ? '📹' : '📎'}</span>
                    <span style={{ fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)', textAlign: 'center', padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{f.name}</span>
                  </div>
              }
              <button onClick={() => removeFile(i)}
                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.75)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: '#fff', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={handleSubmit} disabled={submitting || (!text.trim() && files.length === 0)} className="btn btn-danger"
        style={{ opacity: (submitting || (!text.trim() && files.length === 0)) ? 0.5 : 1 }}>
        {submitting ? '⏳ Submitting...' : '📨 SUBMIT COMPLAINT'}
      </button>
    </div>
  );
}

export default function ConcertDetail({ onOpenCart }) {
  const { id }   = useParams();
  const { user } = useAuth();
  const { addTicket, cartItems } = useCart();

  const [event,       setEvent]       = useState(null);
  const [tiers,       setTiers]       = useState([]);
  const [dynamicData, setDynamicData] = useState(null);
  const [hasTicket,   setHasTicket]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [dpLoading,   setDpLoading]   = useState(false);
  const [activeTab,   setActiveTab]   = useState('INFO');
  const [alert,       setAlert]       = useState(null);
  const [tierQty,     setTierQty]     = useState({ 1: 1, 2: 1, 3: 1 });
  const [addedTier,   setAddedTier]   = useState(null);
  const dpInterval                    = useRef(null);

  // ── Load event ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => {
        const ev = res.data?.event || res.data;
        setEvent(ev);
        const built = [];
        if (ev?.tier1_quantity > 0 && Number(ev.tier1_price) > 0)
          built.push({ id: 1, tierNum: 1, label: TIER_NAMES[1], name: TIER_FULL[1], price: Number(ev.tier1_price), capacity: ev.tier1_quantity });
        if (ev?.tier2_quantity > 0 && Number(ev.tier2_price) > 0)
          built.push({ id: 2, tierNum: 2, label: TIER_NAMES[2], name: TIER_FULL[2], price: Number(ev.tier2_price), capacity: ev.tier2_quantity });
        if (ev?.tier3_quantity > 0 && Number(ev.tier3_price) > 0)
          built.push({ id: 3, tierNum: 3, label: TIER_NAMES[3], name: TIER_FULL[3], price: Number(ev.tier3_price), capacity: ev.tier3_quantity });
        setTiers(built);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch dynamic prices from /pricing/event/:id — poll every 60 s ──────────
  const fetchDynamicPrice = useCallback(() => {
    setDpLoading(true);
    api.get(`/pricing/event/${id}`)                        // ✅ FIXED endpoint
      .then(res => setDynamicData(adaptPricingResponse(res.data)))  // ✅ adapt shape
      .catch(() => {})
      .finally(() => setDpLoading(false));
  }, [id]);

  useEffect(() => {
    fetchDynamicPrice();
    dpInterval.current = setInterval(fetchDynamicPrice, 60_000);
    return () => clearInterval(dpInterval.current);
  }, [fetchDynamicPrice]);

  // ── Check ticket ownership ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== 'audience') return;
    api.get('/tickets/mine')
      .then(res => {
        const purchases = res.data?.purchases || [];
        setHasTicket(purchases.some(p => String(p.event_id) === String(id)));
      })
      .catch(() => {});
  }, [id, user]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  const getDynamicTier = (tierNum) =>
    dynamicData?.tiers?.find(t => t.tier === tierNum) || null;

  const effectivePrice = (tier) => {
    const dp = getDynamicTier(tier.tierNum);
    return dp ? dp.price : tier.price;
  };

  const cartTicketCount = (tierNum) => {
    const cartId = `ticket-${id}-${tierNum}`;
    return (cartItems || []).find(i => i.cartId === cartId)?.quantity || 0;
  };

  const totalInCart = (cartItems || [])
    .filter(i => i.type === 'ticket' && String(i.event_id) === String(id))
    .reduce((s, i) => s + i.quantity, 0);

  const totalTicketValue = (cartItems || [])
    .filter(i => i.type === 'ticket' && String(i.event_id) === String(id))
    .reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const handleAddToCart = (tier) => {
    if (!user) { showAlert('error', 'Please login to buy tickets'); return; }
    const qty   = tierQty[tier.tierNum] || 1;
    const price = effectivePrice(tier);
    addTicket(
      { id: Number(id), title: event.title, venue: event.venue, event_date: event.date || event.event_date, banner_image: event.poster || event.banner_image },
      { label: tier.label, tierNum: tier.tierNum, price },
      qty
    );
    setAddedTier(tier.tierNum);
    setTimeout(() => setAddedTier(null), 2000);
    showAlert('success', `✅ ${qty} × ${tier.name} added to cart at ৳${price.toLocaleString()}!`);
  };

  const formatDate = (ev) => {
    const raw = ev?.date || ev?.event_date;
    if (!raw) return 'Date TBD';
    return new Date(raw).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderDpStatusBanner = () => {
    if (!dynamicData?.dynamic_enabled) return null;
    const { computed_at } = dynamicData;
    const time = computed_at ? new Date(computed_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' }) : '';
    const maxMult = Math.max(1, ...(dynamicData.tiers || []).map(t => t.multiplier || 1));
    const anySurge = maxMult > 1.05;

    return (
      <div style={{ background: anySurge ? 'rgba(255,107,0,0.07)' : 'rgba(176,64,255,0.06)', border: `1px solid ${anySurge ? 'rgba(255,107,0,0.3)' : 'rgba(176,64,255,0.25)'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: anySurge ? '#ff8c42' : '#b040ff', letterSpacing: '0.08em' }}>
          🧠 {anySurge ? `SURGE PRICING ACTIVE · ${maxMult.toFixed(2)}× peak` : 'AI PRICING ACTIVE'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)' }}>updated {time}</span>
          <button onClick={fetchDynamicPrice} disabled={dpLoading}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px 8px', fontFamily: 'var(--text-mono)', fontSize: '9px' }}>
            {dpLoading ? '...' : '⟳'}
          </button>
        </div>
      </div>
    );
  };

  const singerName = event?.singer_name || 'Artist TBD';

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
  if (!event)  return (
    <div className="main-content">
      <div className="empty-state">
        <div className="empty-icon">🎵</div>
        <div className="empty-title">EVENT NOT FOUND</div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg,#040810 0%,#0a1624 50%,#040810 100%)', borderBottom: '1px solid rgba(0,212,255,0.15)', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
        {event.poster && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${event.poster})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12, pointerEvents: 'none' }} />}
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>🎵 Concert</div>
          <h1 style={{ fontFamily: 'var(--text-display)', fontSize: 'clamp(20px,4vw,32px)', color: 'var(--cyan)', letterSpacing: '0.06em', textShadow: 'var(--cyan-glow)', marginBottom: '14px' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', text: event.venue || 'Venue TBD' },
              { icon: '📅', text: formatDate(event) },
              { icon: '🕐', text: event.time ? String(event.time).slice(0,5) : 'Time TBD' },
              { icon: '🎤', text: singerName },
              { icon: '🏙️', text: event.city || 'Dhaka' },
            ].map(item => (
              <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>{alert.text}</div>}

        {totalInCart > 0 && (
          <div style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.25)', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--cyan)' }}>
              🎫 {totalInCart} ticket(s) from this event in your cart
            </span>
            <button onClick={onOpenCart} style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', padding: '8px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
              🛒 View Cart →
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>

          {/* Left: Info + Complaint */}
          <div className="panel">
            <div className="panel-tabs">
              {['INFO', ...(user?.role === 'audience' ? ['COMPLAINT'] : [])].map(tab => (
                <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                  {tab === 'COMPLAINT' && (
                    <span style={{ marginLeft: '6px', background: hasTicket ? '#FF5252' : '#555', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '9px', fontWeight: '700' }}>
                      {hasTicket ? '● NEW' : '🔒'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="panel-body">
              {activeTab === 'INFO' ? (
                <div>
                  {event.description && (
                    <div style={{ fontFamily: 'var(--text-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '28px' }}>
                      {event.description}
                    </div>
                  )}
                  {tiers.length > 0 ? (
                    <div>
                      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Available Seat Types
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {tiers.map(tier => {
                          const dp    = getDynamicTier(tier.tierNum);
                          const price = dp ? dp.price : tier.price;
                          const mult  = dp ? dp.multiplier : 1.0;
                          const color = TIER_COLOR[tier.tierNum];
                          return (
                            <div key={tier.id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', minWidth: '160px' }}>
                              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px' }}>{tier.name}</div>
                              <div style={{ fontFamily: 'var(--text-display)', fontSize: '22px', color, textShadow: 'var(--gold-glow)' }}>
                                ৳{price.toLocaleString()}
                              </div>
                              {mult > 1.05 && (
                                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                  base ৳{tier.price.toLocaleString()} · <span style={{ color: '#ff8c42' }}>{mult.toFixed(2)}×</span>
                                </div>
                              )}
                              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                {tier.capacity?.toLocaleString()} seats
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      🎟️ Ticket tiers not yet configured for this event.
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontFamily: 'var(--text-display)', fontSize: '16px', color: '#FF5252', marginBottom: '6px' }}>📋 Submit a Complaint</div>
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>Report an issue — sound, security, facilities, staff behaviour, or anything else.</div>
                  </div>
                  <ComplaintBox eventId={Number(id)} hasTicket={hasTicket} />
                </div>
              )}
            </div>
          </div>

          {/* Right: ticket purchase panel */}
          {user?.role === 'audience' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)', borderTop: '2px solid var(--cyan)', borderRadius: 'var(--radius-lg)', padding: '24px', height: 'fit-content' }}>
              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '16px' }}>
                🎟️ Select Seat Type
              </div>
              {renderDpStatusBanner()}
              {tiers.length === 0 ? (
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>No tickets available yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {tiers.map(tier => (
                    <DynamicTierCard
                      key={tier.id}
                      tier={tier}
                      dynamicData={getDynamicTier(tier.tierNum)}
                      basePrice={tier.price}
                      tierQty={tierQty[tier.tierNum] || 1}
                      onQtyChange={v => setTierQty(q => ({ ...q, [tier.tierNum]: v }))}
                      onAddToCart={() => handleAddToCart(tier)}
                      inCart={cartTicketCount(tier.tierNum)}
                      isAdded={addedTier === tier.tierNum}
                    />
                  ))}
                  {totalInCart > 0 && (
                    <button onClick={onOpenCart}
                      style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--text-mono)', letterSpacing: '0.05em', textAlign: 'center' }}>
                      🛒 VIEW CART · ৳{totalTicketValue.toLocaleString()}
                    </button>
                  )}
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.05em', lineHeight: 1.7 }}>
                    🔒 Secure checkout via cart<br />
                    {dynamicData?.dynamic_enabled
                      ? '🧠 Prices refresh every 60 s based on demand'
                      : 'Mix tickets + marketplace items in one order'}
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center', height: 'fit-content' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }}>Login as Audience to buy tickets</div>
              <a href="/login" className="btn btn-solid-cyan btn-block">LOGIN</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
