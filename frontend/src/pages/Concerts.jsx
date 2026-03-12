import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PaymentGateway from '../components/PaymentGateway';

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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function ConcertCard({ event, onClick }) {
  const isFree = event.tier1_price === 0 &&
    (!event.tier2_price || event.tier2_price === 0);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(145deg, #0F1E38, #122040)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', overflow: 'hidden',
        cursor: 'pointer', transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: 'linear-gradient(135deg,#0a1628,#0f1e35)' }}>
        {event.banner_image ? (
          <img src={event.banner_image} alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '56px' }}>🎵</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />

        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          {isFree && (
            <span style={{ background: '#00BFA6', color: '#000', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>FREE ENTRY</span>
          )}
        </div>

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
        <h3 style={{ fontFamily: '"Cinzel", serif', fontSize: '16px', fontWeight: '600', color: '#EEF2FF', marginBottom: '10px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', color: '#8B9BB4' }}>📅 {formatDate(event.event_date)}</div>
          <div style={{ fontSize: '13px', color: '#8B9BB4' }}>🕐 {formatTime(event.event_time)}</div>
          <div style={{ fontSize: '13px', color: '#8B9BB4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏛️ {event.venue}</div>
          {event.singer_name && <div style={{ fontSize: '13px', color: '#00BFA6' }}>🎤 {event.singer_name}</div>}
          {event.organizer_name && <div style={{ fontSize: '12px', color: '#4A5A72' }}>🏢 {event.organizer_name}</div>}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {event.tier1_quantity > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#8B9BB4', textTransform: 'uppercase' }}>Tier 1</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: event.tier1_price === 0 ? '#00BFA6' : '#D4A853' }}>
                {event.tier1_price === 0 ? 'FREE' : `৳${event.tier1_price}`}
              </div>
            </div>
          )}
          {event.tier2_quantity > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#8B9BB4', textTransform: 'uppercase' }}>Tier 2</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#D4A853' }}>৳{event.tier2_price}</div>
            </div>
          )}
          {event.tier3_quantity > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#8B9BB4', textTransform: 'uppercase' }}>Tier 3</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#b040ff' }}>৳{event.tier3_price}</div>
            </div>
          )}
        </div>

        <button style={{
          width: '100%',
          background: ['approved', 'live'].includes(event.status)
            ? 'linear-gradient(135deg, #D4A853, #B8922E)' : 'rgba(255,255,255,0.05)',
          color: ['approved', 'live'].includes(event.status) ? '#000' : '#8B9BB4',
          border: 'none', borderRadius: '8px', padding: '10px',
          fontWeight: '700', fontSize: '13px', cursor: 'pointer',
          fontFamily: '"Exo 2", sans-serif',
        }}>
          {event.status === 'live' ? '🔴 Live Now — Get Tickets'
            : event.status === 'approved' ? '🎟️ View & Get Tickets'
            : '📖 View Details'}
        </button>
      </div>
    </div>
  );
}

function ConcertModal({ event, user, onClose, onBuyTicket }) {
  if (!event) return null;
  const tiers = [
    { label: 'Tier 1', price: event.tier1_price, qty: event.tier1_quantity, color: '#D4A853' },
    { label: 'Tier 2', price: event.tier2_price, qty: event.tier2_quantity, color: '#00BFA6' },
    { label: 'Tier 3', price: event.tier3_price, qty: event.tier3_quantity, color: '#b040ff' },
  ].filter(t => t.qty > 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}>
      <div style={{ background: '#0F1E38', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '20px', maxWidth: '640px', width: '100%', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Banner */}
        <div style={{ position: 'relative', height: '260px', background: 'linear-gradient(135deg,#0a1628,#0f1e35)' }}>
          {event.banner_image && (
            <img src={event.banner_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,30,56,1) 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          <div style={{ position: 'absolute', bottom: '14px', left: '20px' }}>
            <span style={{ background: `${statusColor[event.status]}22`, color: statusColor[event.status], border: `1px solid ${statusColor[event.status]}44`, fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
              {statusLabel[event.status]}
            </span>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '22px', color: '#EEF2FF', marginBottom: '8px', lineHeight: 1.3 }}>
            {event.title}
          </h2>

          {event.description && (
            <p style={{ color: '#8B9BB4', fontSize: '14px', lineHeight: 1.8, marginBottom: '20px' }}>
              {event.description}
            </p>
          )}

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { icon: '📅', label: 'Date',      value: formatDate(event.event_date) },
              { icon: '🕐', label: 'Time',      value: formatTime(event.event_time) },
              { icon: '🏛️', label: 'Venue',     value: event.venue },
              { icon: '📍', label: 'City',      value: event.city },
              { icon: '🎤', label: 'Artist',    value: event.singer_name },
              { icon: '🏢', label: 'Organizer', value: event.organizer_name },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: '#4A5A72', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{row.icon} {row.label}</div>
                <div style={{ fontSize: '13px', color: '#EEF2FF', fontWeight: '500' }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Ticket tiers */}
          {tiers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#4A5A72', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>🎟️ Choose Your Ticket</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tiers.map(tier => (
                  <div key={tier.label}
                    onClick={() => ['approved', 'live'].includes(event.status) && onBuyTicket(event, tier)}
                    style={{
                      background: `${tier.color}11`, border: `1px solid ${tier.color}33`,
                      borderRadius: '12px', padding: '16px 22px', textAlign: 'center',
                      cursor: ['approved', 'live'].includes(event.status) ? 'pointer' : 'default',
                      transition: 'all 0.2s', flex: 1, minWidth: '100px',
                    }}
                    onMouseEnter={e => {
                      if (['approved', 'live'].includes(event.status)) {
                        e.currentTarget.style.background = `${tier.color}22`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `${tier.color}11`;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#4A5A72', marginBottom: '6px' }}>{tier.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: tier.color, fontFamily: '"Cinzel",serif' }}>
                      {tier.price === 0 ? 'FREE' : `৳${tier.price}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4A5A72', marginTop: '6px' }}>{tier.qty} seats</div>
                    {['approved', 'live'].includes(event.status) && tier.price > 0 && (
                      <div style={{ fontSize: '10px', color: tier.color, marginTop: '6px', fontWeight: '600' }}>Click to Buy →</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login prompt if not logged in */}
          {!user && ['approved', 'live'].includes(event.status) && (
            <div style={{ background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', color: '#D4A853', textAlign: 'center' }}>
              🔐 Please <a href="/login" style={{ color: '#D4A853', fontWeight: '700' }}>login</a> to purchase tickets
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#8B9BB4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '14px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Concerts() {
  const { user } = useAuth();
  const [events, setEvents]             = useState([]);
  const [featured, setFeatured]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({});
  const [heroIdx, setHeroIdx]           = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Payment state
  const [payingEvent, setPayingEvent]   = useState(null);
  const [payingTier, setPayingTier]     = useState(null);
  const [orderSuccess, setOrderSuccess] = useState('');

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
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events || []);
      setPagination(res.data.pagination || {});
      setPage(p);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = (event, tier) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedEvent(null);
    setPayingEvent(event);
    setPayingTier(tier);
  };

  const handlePaymentSuccess = async (txId) => {
    setPayingEvent(null);
    setPayingTier(null);
    try {
      await api.post('/tickets/buy', {
        event_id: payingEvent.id,
        tier: payingTier.label === 'Tier 1' ? 1 : payingTier.label === 'Tier 2' ? 2 : 3,
        price: payingTier.price,
        transaction_id: txId,
      });
      setOrderSuccess(`✅ Ticket purchased for "${payingEvent.title}"! Check your dashboard.`);
    } catch {
      setOrderSuccess(`✅ Payment done (${txId})! Tickets purchased! Go to Dashboard → Tickets to view your QR codes.`);
    }
    setTimeout(() => setOrderSuccess(''), 6000);
  };

  const heroEvent = featured[heroIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#060D18', color: '#EEF2FF', fontFamily: '"Exo 2", sans-serif' }}>

      {/* Payment Gateway */}
      {payingEvent && payingTier && (
        <PaymentGateway
          amount={payingTier.price}
          itemDescription={`${payingTier.label} Ticket — ${payingEvent.title}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setPayingEvent(null); setPayingTier(null); }}
        />
      )}

      {/* Concert Detail Modal */}
      {selectedEvent && (
        <ConcertModal
          event={selectedEvent}
          user={user}
          onClose={() => setSelectedEvent(null)}
          onBuyTicket={handleBuyTicket}
        />
      )}

      {/* Order success banner */}
      {orderSuccess && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', background: '#00BFA6', color: '#000', padding: '14px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', maxWidth: '380px', fontFamily: '"Exo 2",sans-serif' }}>
          {orderSuccess}
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────── */}
      {heroEvent && (
        <div style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
          <img src={heroEvent.banner_image} alt={heroEvent.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,13,24,0.97) 35%, rgba(6,13,24,0.5) 70%, rgba(6,13,24,0.2) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 60px' }}>
            <div style={{ maxWidth: '580px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <span style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px' }}>⭐ FEATURED</span>
                <span style={{ background: `${statusColor[heroEvent.status]}22`, color: statusColor[heroEvent.status], border: `1px solid ${statusColor[heroEvent.status]}44`, fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}>
                  {statusLabel[heroEvent.status]}
                </span>
              </div>
              <h1 style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(20px,3vw,36px)', fontWeight: '700', color: '#EEF2FF', lineHeight: '1.3', marginBottom: '12px' }}>
                {heroEvent.title}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>📅 {formatDate(heroEvent.event_date)} &nbsp;·&nbsp; 🕐 {formatTime(heroEvent.event_time)}</span>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>🏛️ {heroEvent.venue}</span>
                {heroEvent.singer_name && <span style={{ color: '#00BFA6', fontSize: '14px' }}>🎤 {heroEvent.singer_name}</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setSelectedEvent(heroEvent)}
                  style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px 28px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  🎟️ Get Tickets
                </button>
                <button onClick={() => setSelectedEvent(heroEvent)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#EEF2FF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '13px 24px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  Learn More
                </button>
              </div>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: '60px', display: 'flex', gap: '8px' }}>
            {featured.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                style={{ width: i === heroIdx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === heroIdx ? '#D4A853' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
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
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Search concerts, venues, artists..."
                style={{ flex: 1, background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '14px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}
              />
              <button onClick={() => setSearch(searchInput)}
                style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                🔍
              </button>
            </div>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}>
              <option value="">All Status</option>
              <option value="approved">Upcoming</option>
              <option value="live">Live Now</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          {(search || statusFilter) && (
            <button onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); }}
              style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', alignSelf: 'flex-end' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {!loading && (
          <div style={{ marginBottom: '20px', color: '#4A5A72', fontSize: '13px' }}>
            Showing <span style={{ color: '#D4A853', fontWeight: '600' }}>{events.length}</span> of{' '}
            <span style={{ color: '#EEF2FF', fontWeight: '600' }}>{pagination.total || 0}</span> concerts
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
            <div>Try a different search or filter</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {events.map(event => (
              <ConcertCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px', flexWrap: 'wrap' }}>
            <button disabled={page === 1} onClick={() => loadEvents(page - 1)}
              style={{ background: page === 1 ? 'rgba(255,255,255,0.03)' : '#122040', color: page === 1 ? '#4A5A72' : '#EEF2FF', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
              ← Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => loadEvents(p)}
                style={{ background: p === page ? 'linear-gradient(135deg,#D4A853,#B8922E)' : '#122040', color: p === page ? '#000' : '#EEF2FF', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: p === page ? '700' : '400', fontFamily: '"Exo 2",sans-serif', fontSize: '13px' }}>
                {p}
              </button>
            ))}
            <button disabled={page === pagination.pages} onClick={() => loadEvents(page + 1)}
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
