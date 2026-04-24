import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ─── Calendar Component ───────────────────────────────────────────────────────
function BookingCalendar({ bookings, availableDates, onToggleDate, onRespond }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells       = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const toKey = (d) => new Date(year, month, d).toISOString().split('T')[0];

  const getBookingsForDay = (d) => {
    if (!d) return [];
    const key = toKey(d);
    return bookings.filter(b => {
      const raw = b.event_date || null;
      if (!raw) return false;
      return new Date(raw).toISOString().split('T')[0] === key;
    });
  };

  const isAvailable = (d) => d ? availableDates.includes(toKey(d)) : false;

  const isPast = (d) => d
    ? new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : false;

  const [selected, setSelected] = useState(null);

  const handleDayClick = (d) => {
    if (!d || isPast(d)) return;
    const key         = toKey(d);
    const dayBookings = getBookingsForDay(d);
    if (dayBookings.length > 0) {
      setSelected(selected === key ? null : key);
    } else {
      onToggleDate(key);
    }
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(0,200,120,0.25)', border: '1px solid rgba(0,200,120,0.5)', label: 'Available' },
          { color: 'rgba(255,179,0,0.2)',  border: '1px solid rgba(255,179,0,0.5)',  label: 'Booking Request' },
          { color: 'rgba(0,200,255,0.15)', border: '1px solid rgba(0,200,255,0.4)',  label: 'Accepted' },
          { color: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', label: 'Declined' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: l.color, border: l.border }} />
            <span style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <div style={{ fontFamily: 'var(--text-display)', fontSize: '16px', color: 'var(--gold)', letterSpacing: '0.12em' }}>
          {monthNames[month].toUpperCase()} {year}
        </div>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '4px' }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--text-mono)', fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.1em', padding: '6px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const key         = toKey(d);
          const dayBookings = getBookingsForDay(d);
          const hasPending  = dayBookings.some(b => !b.status || b.status === 'pending');
          const hasAccepted = dayBookings.some(b => b.status === 'accepted');
          const hasRejected = dayBookings.some(b => b.status === 'rejected');
          const avail       = isAvailable(d);
          const past        = isPast(d);
          const isToday     = new Date(year, month, d).toDateString() === today.toDateString();
          const isSelected  = selected === key;

          let bg     = 'rgba(255,255,255,0.03)';
          let border = '1px solid rgba(255,255,255,0.06)';
          const cursor = past ? 'default' : 'pointer';

          if (hasAccepted)     { bg = 'rgba(0,200,255,0.12)'; border = '1px solid rgba(0,200,255,0.35)'; }
          else if (hasRejected){ bg = 'rgba(255,80,80,0.1)';  border = '1px solid rgba(255,80,80,0.3)';  }
          else if (hasPending) { bg = 'rgba(255,179,0,0.15)'; border = '1px solid rgba(255,179,0,0.45)'; }
          else if (avail)      { bg = 'rgba(0,200,120,0.12)'; border = '1px solid rgba(0,200,120,0.4)';  }

          if (isSelected) border = '2px solid var(--gold)';
          if (isToday)    border = '2px solid rgba(255,179,0,0.8)';

          return (
            <div
              key={idx}
              onClick={() => handleDayClick(d)}
              style={{ background: bg, border, borderRadius: '8px', minHeight: '52px', padding: '6px', cursor, opacity: past ? 0.4 : 1, transition: 'all 0.15s', position: 'relative' }}
              onMouseEnter={e => { if (!past) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: isToday ? 'var(--gold)' : 'var(--text-secondary)', fontWeight: isToday ? '700' : '400' }}>
                {d}
              </div>
              {dayBookings.length > 0 && (
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {dayBookings.slice(0, 3).map((b, i) => (
                    <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: b.status === 'accepted' ? '#00c8ff' : b.status === 'rejected' ? '#ff5050' : '#ffb300' }} />
                  ))}
                </div>
              )}
              {avail && dayBookings.length === 0 && (
                <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '6px', height: '6px', borderRadius: '50%', background: '#00c878' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day booking detail */}
      {selected && (() => {
        const dayBookings = bookings.filter(b => {
          const raw = b.event_date || null;
          if (!raw) return false;
          return new Date(raw).toISOString().split('T')[0] === selected;
        });
        if (!dayBookings.length) return null;
        return (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
              REQUESTS FOR {selected}
            </div>
            {dayBookings.map(b => (
              <div key={b.booking_id} style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {b.organizer_name || 'Organizer'}
                    </div>
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                      📍 {b.venue || '—'} &nbsp;·&nbsp; ৳{b.proposed_fee?.toLocaleString() || '—'}
                    </div>
                    {b.message && (
                      <div style={{ marginTop: '8px', fontFamily: 'var(--text-body)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{b.message}"
                      </div>
                    )}
                  </div>
                  <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
                    {(b.status || 'PENDING').toUpperCase()}
                  </span>
                </div>
                {(!b.status || b.status === 'pending') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => { onRespond(b.booking_id, 'accepted'); setSelected(null); }}>✓ ACCEPT</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => { onRespond(b.booking_id, 'rejected'); setSelected(null); }}>✗ DECLINE</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      <div style={{ marginTop: '16px', fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.08em', opacity: 0.7 }}>
        💡 Click any future date to toggle availability · Click highlighted dates to see requests
      </div>
    </div>
  );
}

const navBtn = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer',
  width: '32px', height: '32px', fontSize: '18px', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
};

// ─── Shows Panel ──────────────────────────────────────────────────────────────
function ShowsPanel({ events, onPosterUpdated }) {
  const [posterInput, setPosterInput] = useState({});
  const [saving,      setSaving]      = useState({});
  const [saved,       setSaved]       = useState({});
  const [err,         setErr]         = useState({});

  const handlePosterSave = async (eventId) => {
    const url = posterInput[eventId]?.trim();
    if (!url) return;
    setSaving(p => ({ ...p, [eventId]: true }));
    setErr(p => ({ ...p, [eventId]: '' }));
    try {
      await api.put(`/events/${eventId}/poster`, { poster: url });
      setSaved(p => ({ ...p, [eventId]: true }));
      if (onPosterUpdated) onPosterUpdated(eventId, url);
      setTimeout(() => setSaved(p => ({ ...p, [eventId]: false })), 3000);
    } catch (e) {
      setErr(p => ({ ...p, [eventId]: e.response?.data?.message || 'Failed to update poster' }));
    } finally {
      setSaving(p => ({ ...p, [eventId]: false }));
    }
  };

  if (!events?.length) return (
    <div className="empty-state">
      <div className="empty-icon">🎤</div>
      <div className="empty-title">NO SHOWS YET</div>
      <div className="empty-sub">Events where you are the featured artist will appear here</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {events.map(ev => {
        const evDate  = ev.date ? new Date(ev.date) : null;
        const past    = evDate && evDate < new Date();
        const isLive  = ev.status === 'live';
        const eventId = ev.event_id || ev.id;

        return (
          <div key={eventId} style={{
            background:  'var(--bg-secondary)',
            border:      isLive ? '1px solid rgba(255,68,68,0.3)' : past ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,200,120,0.25)',
            borderLeft:  `4px solid ${isLive ? '#ff4444' : past ? '#555' : '#00c878'}`,
            borderRadius:'var(--radius-sm)',
            padding:     '16px',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,179,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {ev.poster
                  ? <img src={ev.poster} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                  : '🎵'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>{ev.title}</div>
                  <span className={`badge ${isLive ? 'badge-red' : past ? 'badge-gold' : 'badge-green'}`}>
                    {isLive ? '🔴 LIVE' : past ? 'DONE' : 'UPCOMING'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  📍 {ev.venue}{ev.city ? `, ${ev.city}` : ''} &nbsp;·&nbsp;
                  {evDate ? evDate.toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                {ev.organizer_name && (
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                    🏢 Organizer: {ev.organizer_name}
                  </div>
                )}
                {ev.proposed_fee > 0 && (
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--gold)', marginTop: '4px' }}>
                    ৳{Number(ev.proposed_fee).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Poster upload — only for upcoming events */}
            {!past && (
              <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: '8px' }}>
                  🖼️ {ev.poster ? 'UPDATE POSTER' : 'ADD POSTER'}
                  {!ev.poster && <span style={{ color: '#ff9900', marginLeft: '6px' }}>— No poster yet</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    className="form-control"
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                    value={posterInput[eventId] || ''}
                    onChange={e => setPosterInput(p => ({ ...p, [eventId]: e.target.value }))}
                    style={{ flex: 1, minWidth: '200px', fontSize: '12px' }}
                  />
                  <button
                    className="btn btn-sm"
                    onClick={() => handlePosterSave(eventId)}
                    disabled={saving[eventId] || !posterInput[eventId]?.trim()}
                    style={{ background: 'linear-gradient(135deg,var(--gold),#B8922E)', color: '#000', border: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {saving[eventId] ? 'Saving...' : saved[eventId] ? '✅ Saved!' : '💾 Save Poster'}
                  </button>
                </div>
                {err[eventId] && (
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: '#FF5252', marginTop: '6px' }}>{err[eventId]}</div>
                )}
                {posterInput[eventId]?.trim() && (
                  <img src={posterInput[eventId]} alt="preview"
                    style={{ marginTop: '8px', width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SingerDashboard() {
  const { user } = useAuth();

  const [bookings,       setBookings]       = useState([]);
  const [profile,        setProfile]        = useState({});
  const [items,          setItems]          = useState([]);
  const [events,         setEvents]         = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('BOOKINGS');
  const [alert,          setAlert]          = useState(null);
  const [editMode,       setEditMode]       = useState(false);
  const [profileForm,    setProfileForm]    = useState({ genre: '', bio: '', booking_fee: '', available: true });

  const userId = user?.u_id || user?.id;

 useEffect(() => {
  if (!userId) return;
  setLoading(true);

  Promise.all([
    api.get('/events/bookings/mine').catch(err => {
      console.error('❌ /events/bookings/mine:', err.response?.status, err.response?.data);
      return { data: [] };
    }),
    api.get('/users/me').catch(err => {
      console.error('❌ /users/me:', err.response?.status, err.response?.data);
      return { data: {} };
    }),
    api.get('/marketplace').catch(err => {
      console.error('❌ /marketplace:', err.response?.status, err.response?.data);
      return { data: [] };
    }),
    api.get('/users/singer/availability').catch(err => {
      console.error('❌ /singer/availability:', err.response?.status, err.response?.data);
      return { data: [] };
    }),
    api.get('/users/singer/shows').catch(err => {
      console.error('❌ /singer/shows:', err.response?.status, err.response?.data);
      return { data: [] };
    }),
  ])
    .then(([bkRes, meRes, mktRes, availRes, showsRes]) => {
      setBookings(Array.isArray(bkRes.data) ? bkRes.data : []);

      const me = meRes.data || {};
      setProfile(me);
      setProfileForm({
        genre:       me.genre       || '',
        bio:         me.bio         || '',
        booking_fee: me.booking_fee || '',
        available:   me.available   !== false,
      });

      const allItems = mktRes.data?.items || (Array.isArray(mktRes.data) ? mktRes.data : []);
      setItems(allItems.filter(i => i.seller_id === userId));

      setAvailableDates(Array.isArray(availRes.data) ? availRes.data : []);
      setEvents(Array.isArray(showsRes.data) ? showsRes.data : []);
    })
    .catch(err => {
      console.error('SingerDashboard unexpected error:', err);
    })
    .finally(() => setLoading(false));
}, [userId]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleProfileUpdate = async () => {
    try {
      await api.put('/users/singer-profile', profileForm);
      setProfile(p => ({ ...p, ...profileForm }));
      setEditMode(false);
      showAlert('success', 'Profile updated successfully');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleBookingRespond = async (bookingId, status) => {
    try {
      await api.put(`/events/booking/${bookingId}/respond`, { status });
      setBookings(prev => prev.map(bk => bk.booking_id === bookingId ? { ...bk, status } : bk));
      showAlert('success', `Booking ${status}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to respond to booking');
    }
  };

  const handleToggleDate = async (dateKey) => {
    const isNowAvailable = availableDates.includes(dateKey);
    const next = isNowAvailable
      ? availableDates.filter(d => d !== dateKey)
      : [...availableDates, dateKey];
    setAvailableDates(next);
    try {
      await api.put('/users/singer/availability', { dates: next });
    } catch {
      setAvailableDates(availableDates);
      showAlert('error', 'Failed to update availability');
    }
  };

  const TABS = ['BOOKINGS', 'CALENDAR', 'SHOWS', 'PROFILE', 'MERCH'];

  const pendingCount  = bookings.filter(b => !b.status || b.status === 'pending').length;
  const acceptedCount = bookings.filter(b => b.status === 'accepted').length;
  const upcomingShows = events.filter(e => e.date && new Date(e.date) >= new Date()).length;

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
            Artist Control Panel
          </div>
          <div className="flex-between">
            <h1 style={{ fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--gold)', letterSpacing: '0.08em', textShadow: 'var(--gold-glow)' }}>
              SINGER DASHBOARD
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-md" style={{ background: 'var(--gold-dim)', border: '2px solid rgba(255,179,0,0.4)', color: 'var(--gold)', fontSize: '16px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(user?.name || user?.unique_username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {user?.name || user?.unique_username}
                </div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ARTIST</div>
              </div>
            </div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: '16px' }}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}>
          <div className="stat-card gold">
            <div><div className="stat-label">Pending</div><div className="stat-value">{pendingCount}</div></div>
            <div className="stat-icon">📬</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Accepted</div><div className="stat-value">{acceptedCount}</div></div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-card cyan">
            <div><div className="stat-label">Upcoming Shows</div><div className="stat-value">{upcomingShows}</div></div>
            <div className="stat-icon">🎤</div>
          </div>
          <div className="stat-card">
            <div><div className="stat-label">Available Days</div><div className="stat-value">{availableDates.length}</div></div>
            <div className="stat-icon">📅</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
                {tab === 'BOOKINGS' && pendingCount > 0 && (
                  <span style={{ marginLeft: '6px', background: '#ffb300', color: '#000', borderRadius: '10px', padding: '1px 6px', fontSize: '9px', fontWeight: '700' }}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>

            ) : activeTab === 'BOOKINGS' ? (
              bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📬</div>
                  <div className="empty-title">NO BOOKING REQUESTS YET</div>
                  <div className="empty-sub">Organizers will contact you here when they want to book you</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map(b => (
                    <div key={b.booking_id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {b.organizer_name || 'Organizer'}
                        </div>
                        <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
                          {(b.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        📅 {b.event_date
                          ? new Date(b.event_date).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—'}
                        &nbsp;&nbsp;·&nbsp;&nbsp;
                        📍 {b.venue || '—'}
                        &nbsp;&nbsp;·&nbsp;&nbsp;
                        ৳{b.proposed_fee ? Number(b.proposed_fee).toLocaleString() : '—'}
                      </div>
                      {b.message && (
                        <div style={{ fontFamily: 'var(--text-body)', fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '12px', paddingLeft: '10px', borderLeft: '2px solid rgba(255,179,0,0.3)' }}>
                          "{b.message}"
                        </div>
                      )}
                      {(!b.status || b.status === 'pending') && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleBookingRespond(b.booking_id, 'accepted')}>✓ ACCEPT</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => handleBookingRespond(b.booking_id, 'rejected')}>✗ DECLINE</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )

            ) : activeTab === 'CALENDAR' ? (
              <BookingCalendar
                bookings={bookings}
                availableDates={availableDates}
                onToggleDate={handleToggleDate}
                onRespond={handleBookingRespond}
              />

            ) : activeTab === 'SHOWS' ? (
              <ShowsPanel
                events={events}
                onPosterUpdated={(eventId, url) => {
                  setEvents(prev => prev.map(e => (e.event_id || e.id) === eventId ? { ...e, poster: url } : e));
                }}
              />

            ) : activeTab === 'PROFILE' ? (
              <div style={{ maxWidth: '500px' }}>
                {editMode ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Genre</label>
                      <input className="form-control" placeholder="e.g. Rabindra Sangeet, Pop"
                        value={profileForm.genre} onChange={e => setProfileForm(p => ({ ...p, genre: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea className="form-control" rows={4} placeholder="Tell organizers about yourself..."
                        value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                        style={{ resize: 'vertical' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Booking Fee (৳ per show)</label>
                      <input className="form-control" type="number" placeholder="e.g. 50000"
                        value={profileForm.booking_fee} onChange={e => setProfileForm(p => ({ ...p, booking_fee: e.target.value }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button className="btn btn-solid-gold" onClick={handleProfileUpdate}>SAVE PROFILE</button>
                      <button className="btn btn-ghost" onClick={() => setEditMode(false)}>CANCEL</button>
                    </div>
                  </>
                ) : (
                  <div>
                    {[
                      { label: 'Genre',       value: profile.genre       || '—' },
                      { label: 'Bio',         value: profile.bio         || '—' },
                      { label: 'Booking Fee', value: profile.booking_fee ? `৳${Number(profile.booking_fee).toLocaleString()}` : '—' },
                      { label: 'Email',       value: profile.email       || '—' },
                    ].map(row => (
                      <div key={row.label} style={{ padding: '12px 0', borderBottom: 'var(--border-dim)', display: 'flex', gap: '20px' }}>
                        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', width: '100px', flexShrink: 0, paddingTop: '2px' }}>
                          {row.label}
                        </div>
                        <div style={{ fontFamily: 'var(--text-body)', fontSize: '14px', color: 'var(--text-primary)' }}>{row.value}</div>
                      </div>
                    ))}
                    <button className="btn btn-gold btn-sm" style={{ marginTop: '16px' }} onClick={() => setEditMode(true)}>EDIT PROFILE</button>
                  </div>
                )}
              </div>

            ) : (
              /* MERCH */
              items.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-title">NO MERCHANDISE LISTED</div>
                  <div className="empty-sub">Go to Marketplace to add items</div>
                </div>
              ) : (
                <div className="product-grid">
                  {items.map(item => (
                    <div key={item.id} className="product-card">
                      <div className="product-image">🎵</div>
                      <div className="product-body">
                        <div className="product-name">{item.name}</div>
                        <div className="product-price">৳{item.price?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
