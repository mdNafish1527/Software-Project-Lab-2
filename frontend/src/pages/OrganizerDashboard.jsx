import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_COLOR = {
  pending:   '#D4A853',
  approved:  '#00BFA6',
  live:      '#ff4444',
  ended:     '#888',
  cancelled: '#FF5252',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Ticket Sales Modal ───────────────────────────────────────────────────────
function TicketSalesModal({ eventId, eventTitle, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${eventId}/ticket-sales`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(212,168,83,0.25)', borderRadius: 'var(--radius-lg)', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '4px' }}>TICKET SALES REPORT</div>
            <h3 style={{ fontFamily: 'var(--text-display)', fontSize: '16px', color: 'var(--gold)' }}>{eventTitle}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 10px' }}>✕</button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : !data ? (
          <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No sales data</div></div>
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Total Sold',    value: data.totalSold,                     icon: '🎟️', color: 'var(--cyan)' },
                { label: 'Total Revenue', value: `৳${Number(data.totalRevenue).toLocaleString()}`, icon: '💰', color: 'var(--gold)' },
                { label: 'Tiers Active',  value: data.tiers.length,                  icon: '🏷️', color: '#b040ff' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'var(--text-display)', fontSize: '18px', color: s.color, fontWeight: '700' }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tier breakdown */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '12px' }}>TIER BREAKDOWN</div>
              {data.tiers.map(t => {
                const pct = t.capacity > 0 ? Math.round((t.sold / t.capacity) * 100) : 0;
                const color = t.tier === 1 ? 'var(--gold)' : t.tier === 2 ? 'var(--cyan)' : '#b040ff';
                return (
                  <div key={t.tier} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '10px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color }}>Tier {t.tier}</span>
                        <span style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>৳{t.price} × {t.sold}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{t.sold}/{t.capacity} sold</span>
                        <span style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: 'var(--gold)' }}>৳{t.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color})`, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {pct}% sold · {t.remaining} remaining
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent purchases */}
            {data.recentPurchases.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '12px' }}>RECENT PURCHASES</div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Buyer</th><th>Tier</th><th>Price</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {data.recentPurchases.map(p => (
                        <tr key={p.ticket_id}>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px' }}>{p.buyer}</td>
                          <td><span style={{ color: p.tier === 1 ? 'var(--gold)' : p.tier === 2 ? 'var(--cyan)' : '#b040ff', fontFamily: 'var(--text-mono)', fontSize: '12px' }}>Tier {p.tier}</span></td>
                          <td style={{ color: 'var(--gold)', fontFamily: 'var(--text-display)', fontSize: '13px' }}>৳{Number(p.price).toLocaleString()}</td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>{formatDate(p.purchased_at)}</td>
                          <td><span className={`badge ${p.used ? 'badge-gold' : 'badge-green'}`}>{p.used ? 'USED' : 'VALID'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Book Artist Modal ────────────────────────────────────────────────────────
function BookArtistModal({ onClose, onSuccess }) {
  const [singers, setSingers]   = useState([]);
  const [form, setForm]         = useState({ singer_id: '', event_date: '', venue: '', proposed_fee: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]           = useState('');

  useEffect(() => {
    api.get('/users/singers').catch(() => ({ data: [] })).then(r => {
      setSingers(Array.isArray(r.data) ? r.data : (r.data?.singers || []));
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.singer_id || !form.event_date || !form.venue) {
      setErr('Artist, date and venue are required'); return;
    }
    setSubmitting(true); setErr('');
    try {
      await api.post('/events/booking', {
        singer_id:    Number(form.singer_id),
        event_date:   form.event_date,
        venue:        form.venue,
        proposed_fee: Number(form.proposed_fee) || 0,
        message:      form.message,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--cyan)', letterSpacing: '0.15em', marginBottom: '16px' }}>🎤 BOOK AN ARTIST</div>

        {err && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Artist</label>
            <select className="form-control" value={form.singer_id} onChange={e => setForm(p => ({ ...p, singer_id: e.target.value }))}>
              <option value="">— Choose artist —</option>
              {singers.map(s => (
                <option key={s.u_id} value={s.u_id}>{s.unique_username}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Event Date</label>
            <input className="form-control" type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Venue</label>
            <input className="form-control" placeholder="e.g. TSC Auditorium, University of Dhaka" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Proposed Fee (৳)</label>
            <input className="form-control" type="number" placeholder="e.g. 50000" value={form.proposed_fee} onChange={e => setForm(p => ({ ...p, proposed_fee: e.target.value }))} />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Message to Artist</label>
            <textarea className="form-control" rows={3} placeholder="Describe your event, requirements..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sending...' : '📨 Send Booking Request'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user } = useAuth();

  const [events, setEvents]       = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('EVENTS');
  const [alert, setAlert]         = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [salesModal, setSalesModal]   = useState(null);  // { id, title }
  const [showBookModal, setShowBookModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // QR Scanner
  const [qrCode, setQrCode]     = useState('');
  const [qrResult, setQrResult] = useState(null);

  // Create event form
  const [eventForm, setEventForm] = useState({
    title: '', venue: '', city: 'Dhaka', date: '', time: '19:00', description: '', poster: '', fee: 0,
    tier1_price: '', tier1_quantity: '',
    tier2_price: '', tier2_quantity: '',
    tier3_price: '', tier3_quantity: '',
    singer_id: '',
  });

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/events/organizer/mine').catch(() => ({ data: [] })),
      api.get('/events/organizer/bookings').catch(() => ({ data: [] })),
    ]).then(([ev, bk]) => {
      setEvents(Array.isArray(ev.data) ? ev.data : (ev.data?.events || []));
      setBookings(Array.isArray(bk.data) ? bk.data : []);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── QR scan ─────────────────────────────────────────────────────────────────
  const handleQrScan = async () => {
    if (!qrCode) return;
    try {
      const res = await api.post('/tickets/scan', { qr_code: qrCode });
      setQrResult({ success: true, data: res.data });
    } catch (err) {
      setQrResult({ success: false, message: err.response?.data?.message || 'Invalid or already used ticket' });
    }
    setQrCode('');
  };

  // ── Create event ─────────────────────────────────────────────────────────────
  const handleCreateEvent = async () => {
    try {
      await api.post('/events', {
        ...eventForm,
        singer_id:      eventForm.singer_id ? Number(eventForm.singer_id) : null,
        tier1_price:    Number(eventForm.tier1_price)    || 0,
        tier1_quantity: Number(eventForm.tier1_quantity) || 0,
        tier2_price:    Number(eventForm.tier2_price)    || 0,
        tier2_quantity: Number(eventForm.tier2_quantity) || 0,
        tier3_price:    Number(eventForm.tier3_price)    || 0,
        tier3_quantity: Number(eventForm.tier3_quantity) || 0,
      });
      showAlert('success', '🎉 Event created! Pending admin approval.');
      setShowCreateEvent(false);
      refresh();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to create event');
    }
  };

  // ── Dynamic pricing toggle ────────────────────────────────────────────────────
  const toggleDynamicPricing = async (eventId, currentState) => {
    try {
      const res = await api.put(`/events/${eventId}/dynamic-pricing`, { enabled: !currentState });
      showAlert('success', `🧠 Dynamic pricing ${res.data.enabled ? 'enabled' : 'disabled'}`);
      setEvents(prev => prev.map(e =>
        (e.event_id || e.id) === eventId ? { ...e, dynamic_pricing_enable: res.data.enabled ? 1 : 0 } : e
      ));
    } catch (err) {
      showAlert('error', 'Failed to toggle dynamic pricing');
    }
  };

  const displayName = user?.unique_username || user?.username || 'Organizer';
  const liveEvents  = events.filter(e => e.status === 'live' || e.status === 'approved');
  const totalRevenue = '—'; // would need aggregate query

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* Modals */}
        {salesModal && (
          <TicketSalesModal
            eventId={salesModal.id}
            eventTitle={salesModal.title}
            onClose={() => setSalesModal(null)}
          />
        )}
        {showBookModal && (
          <BookArtistModal
            onClose={() => setShowBookModal(false)}
            onSuccess={() => { refresh(); showAlert('success', '📨 Booking request sent!'); }}
          />
        )}

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
            Organizer Control Panel
          </div>
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontFamily: 'var(--text-display)', fontSize: '22px', color: '#b040ff', letterSpacing: '0.08em', textShadow: '0 0 20px rgba(176,64,255,0.4)' }}>
                ORGANIZER DASHBOARD
              </h1>
              <button onClick={refresh} style={{ background: 'rgba(176,64,255,0.08)', border: '1px solid rgba(176,64,255,0.25)', borderRadius: '8px', color: '#b040ff', cursor: 'pointer', padding: '6px 12px', fontSize: '16px' }}>⟳</button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-ghost" onClick={() => setShowBookModal(true)}>🎤 Book Artist</button>
              <button className="btn btn-primary" onClick={() => setShowCreateEvent(!showCreateEvent)}>+ Create Event</button>
            </div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: '16px' }}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">Total Events</div><div className="stat-value">{events.length}</div></div>
            <div className="stat-icon">🎵</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Live / Upcoming</div><div className="stat-value">{liveEvents.length}</div></div>
            <div className="stat-icon">🔴</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Booking Requests</div><div className="stat-value">{bookings.length}</div></div>
            <div className="stat-icon">📨</div>
          </div>
          <div className="stat-card" style={{ background: 'rgba(176,64,255,0.08)', border: '1px solid rgba(176,64,255,0.2)' }}>
            <div><div className="stat-label">Dynamic Pricing</div><div className="stat-value" style={{ color: '#b040ff' }}>{events.filter(e => e.dynamic_pricing_enable).length}</div></div>
            <div className="stat-icon">🧠</div>
          </div>
        </div>

        {/* Create Event Form */}
        {showCreateEvent && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '20px' }}>
              📅 New Event
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              {[
                { label: 'Event Title',   key: 'title',       placeholder: 'Concert title',       col: '1/-1' },
                { label: 'Venue',         key: 'venue',       placeholder: 'Venue name' },
                { label: 'City',          key: 'city',        placeholder: 'e.g. Dhaka' },
                { label: 'Date',          key: 'date',        type: 'date' },
                { label: 'Time',          key: 'time',        type: 'time' },
                { label: 'Poster URL',    key: 'poster',      placeholder: 'https://...' },
                { label: 'Singer ID',     key: 'singer_id',   placeholder: 'Optional singer ID', type: 'number' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ margin: 0, gridColumn: f.col || 'auto' }}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-control" type={f.type || 'text'} placeholder={f.placeholder || ''}
                    value={eventForm[f.key]} onChange={e => setEventForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="form-group" style={{ margin: 0, gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Event description..."
                  value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>

            {/* Tier inputs */}
            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: '12px' }}>TICKET TIERS</div>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: n === 1 ? 'var(--gold)' : n === 2 ? 'var(--cyan)' : '#b040ff', paddingBottom: '10px' }}>Tier {n}</div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Price (৳)</label>
                  <input className="form-control" type="number" placeholder="0 = free"
                    value={eventForm[`tier${n}_price`]} onChange={e => setEventForm(p => ({ ...p, [`tier${n}_price`]: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Capacity</label>
                  <input className="form-control" type="number" placeholder="0 = disabled"
                    value={eventForm[`tier${n}_quantity`]} onChange={e => setEventForm(p => ({ ...p, [`tier${n}_quantity`]: e.target.value }))} />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-primary" onClick={handleCreateEvent}>⚡ CREATE EVENT</button>
              <button className="btn btn-ghost" onClick={() => setShowCreateEvent(false)}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {['EVENTS', 'BOOKING REQUESTS', 'QR SCANNER'].map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
                {tab === 'BOOKING REQUESTS' && bookings.length > 0 && (
                  <span style={{ marginLeft: '6px', background: 'var(--cyan)', color: '#000', borderRadius: '20px', padding: '1px 6px', fontSize: '9px', fontWeight: '700' }}>
                    {bookings.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>

            ) : activeTab === 'EVENTS' ? (
              events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-title">NO EVENTS YET</div>
                  <div className="empty-sub">Create your first event using the button above</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>🧠 Dynammic Pricing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => {
                        const id        = ev.event_id || ev.id;
                        const dpEnabled = ev.dynamic_pricing_enable === 1 || ev.dynamic_pricing_enable === true;
                        return (
                          <tr key={id}>
                            <td style={{ fontWeight: 600, fontFamily: 'var(--text-body)' }}>{ev.title}</td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatDate(ev.date || ev.event_date)}
                            </td>
                            <td>
                              <span className="badge" style={{ color: STATUS_COLOR[ev.status] || '#888', background: `${STATUS_COLOR[ev.status]}18`, border: `1px solid ${STATUS_COLOR[ev.status]}44` }}>
                                {(ev.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {/* Dynamic Pricing Toggle */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  onClick={() => toggleDynamicPricing(id, dpEnabled)}
                                  style={{
                                    width: '40px', height: '22px', borderRadius: '11px',
                                    background: dpEnabled ? 'rgba(176,64,255,0.4)' : 'rgba(255,255,255,0.1)',
                                    border: dpEnabled ? '1px solid #b040ff' : '1px solid rgba(255,255,255,0.15)',
                                    cursor: 'pointer', position: 'relative', transition: 'all 0.3s',
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute', top: '3px',
                                    left: dpEnabled ? '20px' : '3px',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    background: dpEnabled ? '#b040ff' : '#555',
                                    transition: 'left 0.3s',
                                  }} />
                                </div>
                                <span style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: dpEnabled ? '#b040ff' : 'var(--text-dim)' }}>
                                  {dpEnabled ? 'ON' : 'OFF'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  onClick={() => setSalesModal({ id, title: ev.title })}
                                  className="btn btn-ghost btn-sm"
                                  title="View ticket sales"
                                >
                                  📊 Sales
                                </button>
                                <Link to={`/concerts/${id}`} className="btn btn-primary btn-sm">View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )

            ) : activeTab === 'BOOKING REQUESTS' ? (
              bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📨</div>
                  <div className="empty-title">NO BOOKING REQUESTS</div>
                  <div className="empty-sub">Send a booking request to an artist to get started</div>
                  <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setShowBookModal(true)}>
                    🎤 Book an Artist
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowBookModal(true)}>+ New Booking Request</button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Artist</th><th>Event Date</th><th>Venue</th><th>Fee</th><th>Status</th><th>Sent</th></tr>
                      </thead>
                      <tbody>
                        {bookings.map(b => (
                          <tr key={b.id || b.booking_id}>
                            <td style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: 'var(--cyan)' }}>
                              🎤 {b.singer_name}
                            </td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatDate(b.event_date)}
                            </td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.venue}
                            </td>
                            <td style={{ color: 'var(--gold)', fontFamily: 'var(--text-display)', fontSize: '13px' }}>
                              {b.proposed_fee ? `৳${Number(b.proposed_fee).toLocaleString()}` : '—'}
                            </td>
                            <td>
                              <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
                                {(b.status || 'PENDING').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                              {formatDate(b.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )

            ) : (
              /* QR SCANNER */
              <div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Enter QR Code or Ticket ID
                </div>
                <div style={{ display: 'flex', gap: '10px', maxWidth: '480px', marginBottom: '24px' }}>
                  <input
                    className="form-control"
                    placeholder="Paste QR code value here..."
                    value={qrCode}
                    onChange={e => setQrCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleQrScan()}
                  />
                  <button className="btn btn-primary" onClick={handleQrScan}>SCAN</button>
                </div>

                <div className="flex-center" style={{ marginBottom: '24px' }}>
                  <div className="qr-frame">
                    <div className="qr-corner tl" /><div className="qr-corner tr" />
                    <div className="qr-corner bl" /><div className="qr-corner br" />
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em', textAlign: 'center' }}>
                      📱<br />SCAN TICKET QR
                    </div>
                  </div>
                </div>

                {qrResult && (
                  <div className={`alert alert-${qrResult.success ? 'success' : 'error'}`}>
                    {qrResult.success
                      ? `✓ VALID — Ticket for: ${qrResult.data?.event_title || 'event'} | Buyer: ${qrResult.data?.buyer || '—'}`
                      : `✗ INVALID — ${qrResult.message}`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
