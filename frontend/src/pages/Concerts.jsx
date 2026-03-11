// ═══════════════════════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/pages/Concerts.jsx
//  REPLACE your existing Concerts.jsx with this file entirely.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const GENRES = [
  'All', 'Rock / Metal', 'Folk / Baul / Cultural', 'Classical / Rabindra Sangeet',
  'Indie / Acoustic', 'Patriotic / Folk', 'Jazz / Blues / Fusion',
  'Sufi / Spiritual / Baul', 'Multi-genre', 'Pop / Indie',
];

const statusColor = { upcoming: '#00BFA6', completed: '#888', ongoing: '#D4A853', cancelled: '#FF5252' };
const statusLabel = { upcoming: '🟢 Upcoming', completed: '✅ Completed', ongoing: '🔴 Live Now', cancelled: '❌ Cancelled' };

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
}

function TicketBadge({ label, price, available }) {
  if (!price && price !== 0) return null;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', padding: '8px 14px', minWidth: '80px',
    }}>
      <span style={{ fontSize: '10px', color: '#8B9BB4', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: '700', color: price === 0 ? '#00BFA6' : '#D4A853', marginTop: '2px' }}>
        {price === 0 ? 'FREE' : `৳${price}`}
      </span>
      {available !== undefined && (
        <span style={{ fontSize: '10px', color: available > 50 ? '#00BFA6' : available > 10 ? '#D4A853' : '#FF5252', marginTop: '2px' }}>
          {available} left
        </span>
      )}
    </div>
  );
}

function ConcertCard({ event, onClick }) {
  const available = (event.total_tickets_general - event.sold_tickets_general) +
                    (event.total_tickets_student - event.sold_tickets_student);
  const totalCap = event.total_tickets_general + event.total_tickets_student + event.total_tickets_vip;
  const soldPct = totalCap > 0 ? Math.round(((totalCap - available) / totalCap) * 100) : 0;
  const isAlmostFull = soldPct >= 80;
  const isFree = event.ticket_price_general === 0 && event.ticket_price_student === 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(145deg, #0F1E38, #122040)',
        border: event.is_featured ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = event.is_featured
          ? '0 12px 40px rgba(212,168,83,0.2)'
          : '0 12px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
        <img
          src={event.banner_image}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.3) 50%, transparent 100%)' }} />

        {/* Top badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {event.is_featured && (
            <span style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
              ⭐ FEATURED
            </span>
          )}
          {isFree && (
            <span style={{ background: '#00BFA6', color: '#000', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
              FREE ENTRY
            </span>
          )}
          {isAlmostFull && event.status === 'upcoming' && (
            <span style={{ background: '#FF5252', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
              🔥 {soldPct}% FULL
            </span>
          )}
        </div>

        {/* Status */}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <span style={{ background: 'rgba(0,0,0,0.6)', color: statusColor[event.status], fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            {statusLabel[event.status]}
          </span>
        </div>

        {/* Genre bottom-left */}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#D4A853', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(212,168,83,0.3)', backdropFilter: 'blur(4px)' }}>
            🎵 {event.genre}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '18px' }}>
        <h3 style={{ fontFamily: '"Cinzel", serif', fontSize: '16px', fontWeight: '600', color: '#EEF2FF', marginBottom: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8B9BB4' }}>
            <span>📅</span>
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8B9BB4' }}>
            <span>🕐</span>
            <span>{formatTime(event.event_time)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8B9BB4' }}>
            <span>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue}</span>
          </div>
          {event.singer_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#00BFA6' }}>
              <span>🎤</span>
              <span>{event.singer_name}</span>
            </div>
          )}
          {event.organizer_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4A5A72' }}>
              <span>🏛️</span>
              <span>{event.organizer_name}</span>
            </div>
          )}
        </div>

        {/* Tickets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {event.ticket_price_student >= 0 && event.total_tickets_student > 0 && (
            <TicketBadge label="Student" price={event.ticket_price_student}
              available={event.total_tickets_student - event.sold_tickets_student} />
          )}
          {event.ticket_price_general > 0 && (
            <TicketBadge label="General" price={event.ticket_price_general}
              available={event.total_tickets_general - event.sold_tickets_general} />
          )}
          {event.ticket_price_vip > 0 && (
            <TicketBadge label="VIP" price={event.ticket_price_vip}
              available={event.total_tickets_vip - event.sold_tickets_vip} />
          )}
        </div>

        {/* CTA */}
        <button
          style={{
            width: '100%', marginTop: '14px',
            background: event.status === 'upcoming'
              ? 'linear-gradient(135deg, #D4A853, #B8922E)'
              : 'rgba(255,255,255,0.05)',
            color: event.status === 'upcoming' ? '#000' : '#8B9BB4',
            border: 'none', borderRadius: '8px', padding: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            fontFamily: '"Exo 2", sans-serif',
          }}
        >
          {event.status === 'upcoming' ? '🎟️ View & Get Tickets' : '📖 View Details'}
        </button>
      </div>
    </div>
  );
}

export default function Concerts() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [genre, setGenre] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    api.get('/events/featured').then(r => setFeatured(r.data)).catch(() => {});
  }, []);

  // Auto-rotate hero
  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured]);

  useEffect(() => {
    loadEvents(1);
  }, [search, genre, statusFilter]);

  const loadEvents = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 12 });
      if (search) params.append('search', search);
      if (genre && genre !== 'All') params.append('genre', genre);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/events?${params}`);
      setEvents(res.data.events);
      setPagination(res.data.pagination);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const heroEvent = featured[heroIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#060D18', color: '#EEF2FF', fontFamily: '"Exo 2", sans-serif' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      {heroEvent && (
        <div style={{ position: 'relative', height: '520px', overflow: 'hidden' }}>
          <img
            src={heroEvent.banner_image}
            alt={heroEvent.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.8s ease' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(6,13,24,0.97) 35%, rgba(6,13,24,0.5) 70%, rgba(6,13,24,0.2) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 60px' }}>
            <div style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', letterSpacing: '1px' }}>⭐ FEATURED</span>
                <span style={{ background: 'rgba(0,191,166,0.15)', color: '#00BFA6', fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(0,191,166,0.3)' }}>🎵 {heroEvent.genre}</span>
              </div>
              <h1 style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(20px,3.5vw,38px)', fontWeight: '700', color: '#EEF2FF', lineHeight: '1.3', marginBottom: '12px' }}>
                {heroEvent.title}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>📅 {formatDate(heroEvent.event_date)} &nbsp;·&nbsp; 🕐 {formatTime(heroEvent.event_time)}</span>
                <span style={{ color: '#8B9BB4', fontSize: '14px' }}>📍 {heroEvent.venue}</span>
                {heroEvent.singer_name && <span style={{ color: '#00BFA6', fontSize: '14px' }}>🎤 {heroEvent.singer_name}</span>}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate(`/concerts/${heroEvent.custom_url || heroEvent.id}`)}
                  style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '10px', padding: '13px 28px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  🎟️ Get Tickets
                </button>
                <button
                  onClick={() => navigate(`/concerts/${heroEvent.custom_url || heroEvent.id}`)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#EEF2FF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '13px 24px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif' }}>
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Hero dots */}
          <div style={{ position: 'absolute', bottom: '20px', left: '60px', display: 'flex', gap: '8px' }}>
            {featured.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}
                style={{ width: i === heroIdx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === heroIdx ? '#D4A853' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Section Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '28px', background: 'linear-gradient(#D4A853,#B8922E)', borderRadius: '2px' }} />
            <h2 style={{ fontFamily: '"Cinzel",serif', fontSize: '26px', fontWeight: '700', color: '#EEF2FF' }}>All Concerts & Events</h2>
          </div>
          <p style={{ color: '#4A5A72', fontSize: '14px', marginLeft: '16px' }}>
            University of Dhaka · IIT-DU · TSC · Shaheed Minar · Suhrawardy Udyan
          </p>
        </div>

        {/* ── FILTERS ────────────────────────────────────────────────── */}
        <div style={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Search */}
            <div style={{ flex: '2 1 250px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Search</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
                  placeholder="Search concerts, venues, artists..."
                  style={{ flex: 1, background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '14px', fontFamily: '"Exo 2",sans-serif', outline: 'none' }}
                />
                <button onClick={() => setSearch(searchInput)}
                  style={{ background: 'linear-gradient(135deg,#D4A853,#B8922E)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: '"Exo 2",sans-serif' }}>
                  🔍
                </button>
              </div>
            </div>

            {/* Genre */}
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value === 'All' ? '' : e.target.value)}
                style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none', cursor: 'pointer' }}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Status */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#4A5A72', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: '100%', background: '#122040', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', color: '#EEF2FF', fontSize: '13px', fontFamily: '"Exo 2",sans-serif', outline: 'none', cursor: 'pointer' }}>
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>

            {/* Clear */}
            {(search || genre || statusFilter) && (
              <button onClick={() => { setSearch(''); setSearchInput(''); setGenre(''); setStatusFilter(''); }}
                style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: '"Exo 2",sans-serif', alignSelf: 'flex-end', marginBottom: '0' }}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Genre quick pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
            {['Rock / Metal', 'Folk / Baul / Cultural', 'Classical / Rabindra Sangeet', 'Indie / Acoustic', 'Patriotic / Folk', 'Sufi / Spiritual / Baul'].map(g => (
              <button key={g}
                onClick={() => setGenre(genre === g ? '' : g)}
                style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  border: genre === g ? '1px solid #D4A853' : '1px solid rgba(255,255,255,0.1)',
                  background: genre === g ? 'rgba(212,168,83,0.12)' : 'transparent',
                  color: genre === g ? '#D4A853' : '#8B9BB4',
                  fontFamily: '"Exo 2",sans-serif', transition: 'all 0.2s',
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ marginBottom: '20px', color: '#4A5A72', fontSize: '13px' }}>
            Showing <span style={{ color: '#D4A853', fontWeight: '600' }}>{events.length}</span> of{' '}
            <span style={{ color: '#EEF2FF', fontWeight: '600' }}>{pagination.total || 0}</span> concerts
          </div>
        )}

        {/* ── CONCERT GRID ──────────────────────────────────────────── */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {events.map(event => (
              <ConcertCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/concerts/${event.custom_url || event.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── PAGINATION ─────────────────────────────────────────────── */}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
