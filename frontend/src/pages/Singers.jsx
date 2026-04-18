import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

// ─── Singer Profile Photo ─────────────────────────────────────────────────────
function SingerAvatar({ src, name, size = 52, border = '2px solid rgba(255,179,0,0.3)' }) {
  const [imgErr, setImgErr] = useState(false);

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border, flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,rgba(255,179,0,0.2),rgba(255,179,0,0.05))',
      border, color: 'var(--gold)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontFamily: 'var(--text-display)', fontWeight: '700',
    }}>
      {name?.charAt(0).toUpperCase() || '🎤'}
    </div>
  );
}

// ─── Singer Card (listing) ────────────────────────────────────────────────────
function SingerCard({ singer, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(255,179,0,0.3)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Photo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        <SingerAvatar src={singer.profile_picture} name={singer.unique_username} size={56} />
        <div>
          <div style={{ fontFamily: 'var(--text-display)', fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '0.03em', marginBottom: '3px' }}>
            {singer.unique_username}
          </div>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.12em' }}>
            ✓ VERIFIED ARTIST
          </div>
        </div>
      </div>

      {/* Genre & Fee badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {singer.genre && (
          <span className="badge badge-gold">🎸 {singer.genre}</span>
        )}
        {singer.fixed_fee > 0 && (
          <span className="badge badge-cyan">৳{Number(singer.fixed_fee).toLocaleString()}/show</span>
        )}
        {singer.availability && (
          <span className="badge badge-green">📅 {singer.availability}</span>
        )}
      </div>

      {/* Bio preview */}
      {singer.bio && (
        <div style={{
          fontFamily: 'var(--text-body)', fontSize: '13px', color: 'var(--text-secondary)',
          lineHeight: 1.6, marginBottom: '14px',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {singer.bio}
        </div>
      )}

      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.05em' }}>
        VIEW PROFILE →
      </div>
    </div>
  );
}

// ─── Singer Detail Modal / Page ───────────────────────────────────────────────
function SingerDetail({ singerId, onClose }) {
  const [singer, setSinger]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!singerId) return;
    setLoading(true);
    api.get(`/users/singers/${singerId}`)
      .then(r => setSinger(r.data))
      .catch(() => setSinger(null))
      .finally(() => setLoading(false));
  }, [singerId]);

  if (!singerId) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0F1E38', border: '1px solid rgba(212,168,83,0.25)', borderRadius: '20px', maxWidth: '640px', width: '100%', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : !singer ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Artist not found</div>
        ) : (
          <>
            {/* Hero */}
            <div style={{ position: 'relative', background: 'linear-gradient(135deg,#0a1628,#0f1e35)', padding: '40px 32px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>✕</button>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <SingerAvatar
                  src={singer.profile_picture}
                  name={singer.unique_username}
                  size={100}
                  border="3px solid rgba(255,179,0,0.4)"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '6px' }}>VERIFIED ARTIST</div>
                  <h2 style={{ fontFamily: 'var(--text-display)', fontSize: '24px', color: 'var(--gold)', letterSpacing: '0.06em', marginBottom: '12px' }}>
                    {singer.unique_username}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {singer.genre && <span className="badge badge-gold">🎸 {singer.genre}</span>}
                    {singer.fixed_fee > 0 && <span className="badge badge-cyan">৳{Number(singer.fixed_fee).toLocaleString()}/show</span>}
                    {singer.availability && <span className="badge badge-green">📅 {singer.availability}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '28px', fontFamily: '"Exo 2",sans-serif' }}>
              {/* Bio */}
              {singer.bio && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '10px' }}>ABOUT</div>
                  <p style={{ fontFamily: 'var(--text-body)', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{singer.bio}</p>
                </div>
              )}

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                {[
                  { icon: '📧', label: 'Email',        value: singer.email },
                  { icon: '🎸', label: 'Genre',        value: singer.genre },
                  { icon: '💰', label: 'Fee per Show', value: singer.fixed_fee > 0 ? `৳${Number(singer.fixed_fee).toLocaleString()}` : 'Negotiable' },
                  { icon: '📅', label: 'Availability', value: singer.availability },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>{row.icon} {row.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Past events */}
              {singer.events?.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '12px' }}>PAST EVENTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {singer.events.map(ev => (
                      <div key={ev.event_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {ev.poster && (
                          <img src={ev.poster} alt={ev.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '3px' }}>{ev.title}</div>
                          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                            📍 {ev.venue} · {ev.city} · {ev.date ? new Date(ev.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </div>
                        <span className={`badge ${ev.status === 'live' ? 'badge-red' : ev.status === 'ended' ? 'badge-gold' : 'badge-green'}`}>
                          {(ev.status || '').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onClose} style={{ width: '100%', marginTop: '24px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontFamily: 'var(--text-mono)', fontSize: '13px', letterSpacing: '0.05em' }}>
                CLOSE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Singers Page ────────────────────────────────────────────────────────
export default function Singers() {
  const { id: paramId } = useParams();  // supports /singers/:id direct URL too

  const [singers, setSingers]         = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState(paramId || null);

  useEffect(() => {
    api.get('/users/singers')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSingers(data);
        setFiltered(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If URL has /singers/:id open that profile directly
  useEffect(() => {
    if (paramId) setSelectedId(paramId);
  }, [paramId]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q
      ? singers.filter(s =>
          s.unique_username?.toLowerCase().includes(q) ||
          s.genre?.toLowerCase().includes(q) ||
          s.bio?.toLowerCase().includes(q)
        )
      : singers
    );
  }, [search, singers]);

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* Detail modal */}
        {selectedId && (
          <SingerDetail singerId={selectedId} onClose={() => setSelectedId(null)} />
        )}

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
            Artist Registry
          </div>
          <div className="flex-between">
            <h1 style={{ fontFamily: 'var(--text-display)', fontSize: '26px', color: 'var(--gold)', letterSpacing: '0.08em', textShadow: 'var(--gold-glow)' }}>
              ARTISTS
            </h1>
            <span className="badge badge-gold">{filtered.length} VERIFIED</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            className="form-control"
            placeholder="Search by name, genre, bio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '80px' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <div className="empty-title">NO ARTISTS FOUND</div>
              <div className="empty-sub">Try a different search term</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
            {filtered.map(singer => (
              <SingerCard
                key={singer.u_id}
                singer={singer}
                onClick={() => setSelectedId(singer.u_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
