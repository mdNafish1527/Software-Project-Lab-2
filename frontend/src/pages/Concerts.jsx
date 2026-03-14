import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const statusColor = {
  approved:  '#00BFA6',
  live:      '#ff4444',
  ended:     '#888',
  cancelled: '#FF5252',
  pending:   '#D4A853',
};
const statusLabel = {
  approved:  '🟢 Upcoming',
  live:      '🔴 Live Now',
  ended:     '✅ Ended',
  cancelled: '❌ Cancelled',
  pending:   '⏳ Pending',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-BD', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

// ─── Dynamic price badge components ──────────────────────────────────────────

function DemandBar({ rate, color }) {
  const pct = Math.round((rate || 0) * 100);
  return (
    <div style={{ marginTop: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#4A5A72', marginBottom: '2px' }}>
        <span>Demand</span><span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: '2px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function PriceBadge({ tierNum, tierColor, pricing, basePrice, loading }) {
  if (!basePrice || basePrice === 0) {
    return <div style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', fontWeight: '700', color: '#00BFA6' }}>FREE</div>;
  }

  const p = pricing;
  const dynamic = p?.dynamicPrice;
  const priceChanged = dynamic && dynamic !== basePrice;

  return (
    <div>
      {/* Main price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <div style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', fontWeight: '700', color: tierColor, lineHeight: 1 }}>
          {loading ? `৳${Number(basePrice).toLocaleString()}` : `৳${Number(dynamic || basePrice).toLocaleString()}`}
        </div>
        {priceChanged && (
          <div style={{ fontSize: '11px', color: '#4A5A72', textDecoration: 'line-through' }}>
            ৳{Number(basePrice).toLocaleString()}
          </div>
        )}
      </div>

      {/* Trend arrow */}
      {!loading && p && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          {p.priceChange === 'increased' && <span style={{ fontSize: '10px', color: '#FF5252', fontWeight: '700' }}>▲ +{p.percentChange}%</span>}
          {p.priceChange === 'decreased' && <span style={{ fontSize: '10px', color: '#00BFA6', fontWeight: '700' }}>▼ {p.percentChange}%</span>}
          {p.priceChange === 'stable'    && <span style={{ fontSize: '10px', color: '#4A5A72' }}>→ stable</span>}
          <span style={{ fontSize: '9px', color: '#4A5A72', fontStyle: 'italic', letterSpacing: '0.05em' }}>AI</span>
        </div>
      )}

      {/* Demand bar */}
      {!loading && p && <DemandBar rate={p.demandRate} color={tierColor} />}

      {/* Remaining seats warning */}
      {!loading && p?.remaining < 20 && p?.remaining > 0 && (
        <div style={{ fontSize: '9px', color: '#FF5252', fontWeight: '700', marginTop: '3px' }}>
          ⚠️ Only {p.remaining} left!
        </div>
      )}
    </div>
  );
}

// ─── Concert Card ─────────────────────────────────────────────────────────────
function ConcertCard({ event, onClick }) {
  const isFree = event.tier1_price === 0 && (!event.tier2_price || event.tier2_price === 0);
  return (
    <div
      onClick={onClick}
      style={{ background: 'linear-gradient(145deg,#0F1E38,#122040)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: 'linear-gradient(135deg,#0a1628,#0f1e35)' }}>
        {event.banner_image
          ? <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '56px' }}>🎵</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(10,22,40,0.95) 0%,rgba(10,22,40,0.3) 50%,transparent 100%)' }} />
        {isFree && (
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
            <span style={{ background: '#00BFA6', color: '#000', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>FREE ENTRY</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span style={{ background: 'rgba(0,0,0,0.6)', color: statusColor[event.status] || '#888', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            {statusLabel[event.status] || event.status}
          </span>
        </div>
        <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#D4A853', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,168,83,0.3)', backdropFilter: 'blur(4px)' }}>
            📍 {event.city}
          </span>
        </div>
      </div>

      <div style={{ padding: '18px' }}>
        <h3 style={{ fontFamily: '"Cinzel",serif', fontSize: '16px', fontWeight: '600', color: '#EEF2FF', marginBottom: '10px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', color: '#8B9BB4' }}>📅 {formatDate(event.event_date)}</div>
          <div style={{ fontSize: '13px', color: '#8B9BB4' }}>🕐 {formatTime(event.event_time)}</div>
          <div style={{ fontSize: '13px', color: '#8B9BB4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏛️ {event.venue}</div>
          {event.singer_name    && <div style={{ fontSize: '13px', color: '#00BFA6' }}>🎤 {event.singer_name}</div>}
          {event.organizer_name && <div style={{ fontSize: '12px', color: '#4A5A72' }}>🏢 {event.organizer_name}</div>}
        </div>

        {/* Static price pills on card — dynamic price shown in modal */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {[
            { n: 1, color: '#D4A853' }, { n: 2, color: '#00BFA6' }, { n: 3, color: '#b040ff' }
          ].filter(t => event[`tier${t.n}_quantity`] > 0).map(t => (
            <div key={t.n} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#8B9BB4', textTransform: 'uppercase' }}>Tier {t.n}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: t.color }}>
                {event[`tier${t.n}_price`] === 0 ? 'FREE' : `৳${event[`tier${t.n}_price`]}`}
              </div>
            </div>
          ))}
        </div>

        <button style={{ width: '100%', background: ['approved','live'].includes(event.status) ? 'linear-gradient(135deg,#D4A853,#B8922E)' : 'rgba(255,255,255,0.05)', color: ['approved','live'].includes(event.status) ? '#000' : '#8B9BB4', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
          {event.status === 'live' ? '🔴 Live — Add Tickets' : event.status === 'approved' ? '🎟️ View & Add Tickets' : '📖 View Details'}
        </button>
      </div>
    </div>
  );
}

// ─── Concert Modal with Bayesian dynamic pricing ──────────────────────────────
function ConcertModal({ event, user, onClose, onOpenCart }) {
  const { addTicket, getTicketInCart } = useCart();

  const [selectedTier, setSelectedTier] = useState(null);
  const [ticketQty, setTicketQty]       = useState(1);
  const [addedMsg, setAddedMsg]         = useState('');

  // ── DYNAMIC PRICING STATE ─────────────────────────────────────────────────
  const [dynamicPricing, setDynamicPricing] = useState({});   // { tier1: {...}, tier2: {...}, tier3: {...} }
  const [priceLoading, setPriceLoading]     = useState(true);

  // Fetch Bayesian prices when modal opens
  useEffect(() => {
    if (!event?.id) return;
    setPriceLoading(true);
    api.get(`/pricing/event/${event.id}`)
      .then(r => {
        setDynamicPricing(r.data?.tiers || {});
      })
      .catch(() => setDynamicPricing({}))   // fallback to base prices on error
      .finally(() => setPriceLoading(false));
  }, [event?.id]);
  // ─────────────────────────────────────────────────────────────────────────

  if (!event) return null;

  const TIER_COLORS = { 1: '#D4A853', 2: '#00BFA6', 3: '#b040ff' };

  // Build tiers using dynamic prices (fallback to base if API failed)
  const tiers = [1, 2, 3]
    .filter(n => event[`tier${n}_quantity`] > 0)
    .map(n => ({
      n,
      label:    `Tier ${n}`,
      // ← use dynamic price if loaded, else fall back to base price
      price:    dynamicPricing[`tier${n}`]?.dynamicPrice ?? event[`tier${n}_price`],
      basePrice: event[`tier${n}_price`],
      qty:      event[`tier${n}_quantity`],
      color:    TIER_COLORS[n],
      pricing:  dynamicPricing[`tier${n}`] || null,
    }));

  const canBook = ['approved', 'live'].includes(event.status);

  const handleAddToCart = () => {
    if (!user) { window.location.href = '/login'; return; }
    addTicket(event, { label: selectedTier.label, price: selectedTier.price }, ticketQty);
    setAddedMsg(`✅ ${ticketQty}× ${selectedTier.label} added to cart at ৳${selectedTier.price}!`);
    setTimeout(() => setAddedMsg(''), 3000);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0F1E38', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '20px', maxWidth: '660px', width: '100%', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Banner */}
        <div style={{ position: 'relative', height: '260px', background: 'linear-gradient(135deg,#0a1628,#0f1e35)' }}>
          {event.banner_image && <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(15,30,56,1) 0%,transparent 60%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          <div style={{ position: 'absolute', bottom: '14px', left: '20px' }}>
            <span style={{ background: `${statusColor[event.status]}22`, color: statusColor[event.status], border: `1px solid ${statusColor[event.status]}44`, fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
              {statusLabel[event.status]}
            </span>
          </div>
        </div>

        <div style={{ padding: '28px', fontFamily: '"Exo 2",sans-serif' }}>
          <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', color: '#EEF2FF', marginBottom: '8px', lineHeight: 1.3 }}>{event.title}</h2>
          {event.description && <p style={{ color: '#8B9BB4', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>{event.description}</p>}

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {[
              { icon: '📅', label: 'Date',      value: formatDate(event.event_date) },
              { icon: '🕐', label: 'Time',      value: formatTime(event.event_time) },
              { icon: '🏛️', label: 'Venue',     value: event.venue },
              { icon: '📍', label: 'City',      value: event.city },
              { icon: '🎤', label: 'Artist',    value: event.singer_name },
              { icon: '🏢', label: 'Organizer', value: event.organizer_name },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#4A5A72', textTransform: 'uppercase', marginBottom: '4px' }}>{row.icon} {row.label}</div>
                <div style={{ fontSize: '13px', color: '#EEF2FF', fontWeight: '500' }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* ── DYNAMIC PRICING SECTION ──────────────────────────────────────── */}
          {tiers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {/* Header with Bayesian badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#4A5A72', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  🎟️ Select Ticket Tier
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(176,64,255,0.1)', border: '1px solid rgba(176,64,255,0.25)', borderRadius: '20px', padding: '3px 10px' }}>
                  <span style={{ fontSize: '9px' }}>🧠</span>
                  <span style={{ fontSize: '9px', color: '#b040ff', fontWeight: '700', letterSpacing: '0.1em' }}>BAYESIAN DYNAMIC PRICING</span>
                </div>
                {priceLoading && (
                  <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#D4A853', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                )}
              </div>

              {/* Tier cards — each shows dynamic price */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tiers.map(tier => {
                  const inCart   = getTicketInCart(event.id, tier.label);
                  const selected = selectedTier?.n === tier.n;
                  return (
                    <div
                      key={tier.n}
                      onClick={() => { if (canBook) { setSelectedTier(tier); setTicketQty(1); } }}
                      style={{
                        background: selected ? `${tier.color}20` : `${tier.color}08`,
                        border: `1px solid ${selected ? tier.color : tier.color + '44'}`,
                        borderRadius: '12px', padding: '14px 18px',
                        cursor: canBook ? 'pointer' : 'default',
                        transition: 'all 0.2s', flex: 1, minWidth: '120px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#4A5A72', marginBottom: '6px' }}>Tier {tier.n}</div>

                      {/* Dynamic price badge */}
                      <PriceBadge
                        tierNum={tier.n}
                        tierColor={tier.color}
                        pricing={tier.pricing}
                        basePrice={tier.basePrice}
                        loading={priceLoading}
                      />

                      <div style={{ fontSize: '11px', color: '#4A5A72', marginTop: '6px' }}>{tier.qty} seats total</div>

                      {inCart && (
                        <div style={{ fontSize: '10px', color: tier.color, marginTop: '4px', fontWeight: '700' }}>
                          🛒 {inCart.quantity} in cart
                        </div>
                      )}
                      {selected && (
                        <div style={{ position: 'absolute', top: '8px', right: '10px', fontSize: '12px', color: tier.color }}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pricing model explanation */}
              <div style={{ marginTop: '10px', background: 'rgba(176,64,255,0.06)', border: '1px solid rgba(176,64,255,0.15)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '14px' }}>🧠</span>
                <div style={{ fontSize: '11px', color: '#4A5A72', lineHeight: '1.6' }}>
                  Prices are adjusted in real-time using a <span style={{ color: '#b040ff' }}>Bayesian Beta-Binomial demand model</span>.
                  Prices rise as seats fill up or the event date approaches, and drop for far-future events as an early-bird incentive.
                </div>
              </div>
            </div>
          )}
          {/* ── END DYNAMIC PRICING SECTION ──────────────────────────────────── */}

          {/* Qty + Add to Cart */}
          {selectedTier && canBook && (
            <div style={{ background: '#122040', border: `1px solid ${selectedTier.color}33`, borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                How many tickets?{' '}
                <span style={{ color: '#8B9BB4', textTransform: 'none', letterSpacing: 0 }}>(max 10)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => setTicketQty(q => Math.max(1, q - 1))} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#EEF2FF', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>−</button>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#EEF2FF', minWidth: '32px', textAlign: 'center' }}>{ticketQty}</span>
                  <button onClick={() => setTicketQty(q => Math.min(10, selectedTier.qty, q + 1))} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#EEF2FF', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>+</button>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#4A5A72' }}>
                    {ticketQty} × {selectedTier.price === 0 ? 'FREE' : `৳${selectedTier.price}`}
                    {selectedTier.price !== selectedTier.basePrice && (
                      <span style={{ color: '#4A5A72', textDecoration: 'line-through', marginLeft: '6px' }}>৳{selectedTier.basePrice}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', fontWeight: '700', color: selectedTier.color }}>
                    {selectedTier.price === 0 ? 'FREE' : `৳${(selectedTier.price * ticketQty).toLocaleString()}`}
                  </div>
                </div>
              </div>

              {addedMsg && (
                <div style={{ background: 'rgba(0,191,166,0.12)', border: '1px solid rgba(0,191,166,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#00BFA6', fontSize: '13px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                  {addedMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAddToCart}
                  style={{ flex: 2, background: `linear-gradient(135deg,${selectedTier.color},${selectedTier.color}cc)`, color: selectedTier.color === '#D4A853' ? '#000' : '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  {!user ? '🔐 Login to Add'
                    : selectedTier.price === 0 ? `🛒 ADD ${ticketQty} FREE TICKET${ticketQty > 1 ? 'S' : ''} TO CART`
                    : `🛒 ADD TO CART · ৳${(selectedTier.price * ticketQty).toLocaleString()}`}
                </button>
                <button
                  onClick={() => { handleAddToCart(); onClose(); onOpenCart(); }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '13px', color: '#EEF2FF', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '12px', fontWeight: '600' }}>
                  🛒 View Cart
                </button>
              </div>
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#8B9BB4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '14px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Concerts Page ───────────────────────────────────────────────────────
export default function Concerts({ onOpenCart }) {
  const { user } = useAuth();

  const [events, setEvents]               = useState([]);
  const [featured, setFeatured]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [searchInput, setSearchInput]     = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState({});
  const [heroIdx, setHeroIdx]             = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    api.get('/events/featured').then(r => setFeatured(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured]);

  useEffect(() => { loadEvents(1); }, [search, statusFilter]);

  const loadEvents = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12 });
      if (search)       params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events || []);
      setPagination(res.data.pagination || {});
      setPage(p);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const heroEvent = featured[heroIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#060D18', color: '#EEF2FF', fontFamily: '"Exo 2",sans-serif' }}>

      {selectedEvent && (
        <ConcertModal
          event={selectedEvent}
          user={user}
          onClose={() => setSelectedEvent(null)}
          onOpenCart={onOpenCart}
        />
      )}

      {/* Hero */}
      {heroEvent && (
        <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
          <img src={heroEvent.banner_image} alt={heroEvent.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(6,13,24,0.97) 35%,rgba(6,13,24,0.5) 70%,rgba(6,13,24,0.2) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 60px' }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <span style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px' }}>⭐ FEATURED</span>
                <span style={{ background: `${statusColor[heroEvent.status]}22`, color: statusColor[heroEvent.status], border: `1px solid ${statusColor[heroEvent.status]}44`, fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}>{statusLabel[heroEvent.status]}</span>
              </div>
              <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(20px,3vw,36px)', fontWeight: '700', color: '#EEF2FF', lineHeight: '1.3', marginBottom: '12px' }}>{heroEvent.title}</h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>📅 {formatDate(heroEvent.event_date)} &nbsp;·&nbsp; 🕐 {formatTime(heroEvent.event_time)}</span>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>🏛️ {heroEvent.venue}</span>
                {heroEvent.singer_name && <span style={{ color: '#00BFA6', fontSize: '14px' }}>🎤 {heroEvent.singer_name}</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setSelectedEvent(heroEvent)} style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px 28px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>🎟️ Get Tickets</button>
                <button onClick={() => setSelectedEvent(heroEvent)} style={{ background: 'rgba(255,255,255,0.08)', color: '#EEF2FF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '13px 24px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>Learn More</button>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '20px', left: '60px', display: 'flex', gap: '8px' }}>
            {featured.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === heroIdx ? '#D4A853' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {/* Listing */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(#D4A853,#B8922E)', borderRadius: '2px' }} />
            <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '24px', fontWeight: '700', color: '#EEF2FF' }}>All Concerts & Events</h2>
          </div>
          <p style={{ color: '#4A5A72', fontSize: '14px', marginLeft: '16px' }}>University of Dhaka · IIT-DU · TSC · Shaheed Minar</p>
        </div>

        {/* Filters */}
        <div style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', marginBottom: '28px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 250px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Search</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)} placeholder="Search concerts, venues, artists..." style={{ flex: 1, background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '14px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }} />
              <button onClick={() => setSearch(searchInput)} style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer' }}>🔍</button>
            </div>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}>
              <option value="">All Status</option>
              <option value="approved">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="ended">Ended</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); }} style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', alignSelf: 'flex-end' }}>✕ Clear</button>
          )}
        </div>

        {!loading && (
          <div style={{ marginBottom: '20px', color: '#4A5A72', fontSize: '13px' }}>
            Showing <span style={{ color: '#D4A853', fontWeight: '600' }}>{events.length}</span> of <span style={{ color: '#EEF2FF', fontWeight: '600' }}>{pagination.total || 0}</span> concerts
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.07)', borderTopColor: '#D4A853', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ color: '#4A5A72' }}>Loading concerts...</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#4A5A72' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
            <div style={{ fontSize: '18px', marginBottom: '8px', color: '#8B9BB4' }}>No concerts found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '24px' }}>
            {events.map(event => (
              <ConcertCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button disabled={page === 1} onClick={() => loadEvents(page - 1)} style={{ background: page === 1 ? 'rgba(255,255,255,0.03)' : '#122040', color: page === 1 ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>← Prev</button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => loadEvents(p)} style={{ background: p === page ? 'linear-gradient(135deg,#D4A853,#B8922E)' : '#122040', color: p === page ? '#000' : '#EEF2FF', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>{p}</button>
            ))}
            <button disabled={page === pagination.pages} onClick={() => loadEvents(page + 1)} style={{ background: page === pagination.pages ? 'rgba(255,255,255,0.03)' : '#122040', color: page === pagination.pages ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>Next →</button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
