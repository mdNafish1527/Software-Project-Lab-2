import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('EVENTS');
  const [alert, setAlert] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [qrResult, setQrResult] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', venue: '', event_date: '', description: '',
    tiers: [{ name: 'General', price: '', capacity: '' }]
  });

  useEffect(() => {
    Promise.all([
      api.get('/events').catch(() => ({ data: [] })),
    ]).then(([ev]) => {
      setEvents(ev.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3000);
  };

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

  const handleCreateEvent = async () => {
    try {
      await api.post('/events', eventForm);
      showAlert('success', 'Event created successfully!');
      setShowCreateEvent(false);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Organizer Control Panel
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--purple)',
              letterSpacing: '0.08em', textShadow: '0 0 20px rgba(176,64,255,0.4)'
            }}>
              ORGANIZER DASHBOARD
            </h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => setShowCreateEvent(!showCreateEvent)}>
                + CREATE EVENT
              </button>
            </div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">My Events</div><div className="stat-value">{events.length}</div></div>
            <div className="stat-icon">🎵</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Artist Bookings</div><div className="stat-value">{bookings.length}</div></div>
            <div className="stat-icon">🎤</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">QR Scanned</div><div className="stat-value">—</div></div>
            <div className="stat-icon">📱</div>
          </div>
        </div>

        {/* Create Event Form */}
        {showCreateEvent && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '20px'
          }}>
            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '20px'
            }}>
              New Event
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input className="form-control" placeholder="Concert title"
                  value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <input className="form-control" placeholder="Venue / Location"
                  value={eventForm.venue} onChange={e => setEventForm(p => ({ ...p, venue: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Event Date</label>
                <input className="form-control" type="datetime-local"
                  value={eventForm.event_date} onChange={e => setEventForm(p => ({ ...p, event_date: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Event description..."
                  value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '16px 0 12px'
            }}>
              Ticket Tiers
            </div>
            {eventForm.tiers.map((tier, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tier Name</label>
                  <input className="form-control" placeholder="e.g. VIP"
                    value={tier.name}
                    onChange={e => setEventForm(p => ({
                      ...p, tiers: p.tiers.map((t, ti) => ti === i ? { ...t, name: e.target.value } : t)
                    }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Price (৳)</label>
                  <input className="form-control" type="number" placeholder="Price"
                    value={tier.price}
                    onChange={e => setEventForm(p => ({
                      ...p, tiers: p.tiers.map((t, ti) => ti === i ? { ...t, price: e.target.value } : t)
                    }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Capacity</label>
                  <input className="form-control" type="number" placeholder="Seats"
                    value={tier.capacity}
                    onChange={e => setEventForm(p => ({
                      ...p, tiers: p.tiers.map((t, ti) => ti === i ? { ...t, capacity: e.target.value } : t)
                    }))} />
                </div>
              </div>
            ))}
            {eventForm.tiers.length < 3 && (
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}
                onClick={() => setEventForm(p => ({ ...p, tiers: [...p.tiers, { name: '', price: '', capacity: '' }] }))}>
                + Add Tier
              </button>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-solid-cyan" onClick={handleCreateEvent}>⚡ CREATE EVENT</button>
              <button className="btn btn-ghost" onClick={() => setShowCreateEvent(false)}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {['EVENTS', 'BOOK ARTIST', 'QR SCANNER'].map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab}
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
                    <thead><tr><th>Title</th><th>Venue</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id}>
                          <td style={{ fontWeight: 600 }}>{ev.title}</td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ev.venue || '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}
                          </td>
                          <td><span className="badge badge-green">LIVE</span></td>
                          <td>
                            <Link to={`/concerts/${ev.id}`} className="btn btn-primary btn-sm">VIEW</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'BOOK ARTIST' ? (
              <div>
                <div style={{
                  fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)',
                  marginBottom: '16px', letterSpacing: '0.08em'
                }}>
                  Browse verified artists and send booking requests
                </div>
                <Link to="/singers" className="btn btn-primary">🎤 BROWSE ARTISTS</Link>
              </div>
            ) : (
              /* QR SCANNER */
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em',
                    textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px'
                  }}>
                    Enter QR Code or Ticket ID
                  </div>
                  <div style={{ display: 'flex', gap: '10px', maxWidth: '480px' }}>
                    <input
                      className="form-control"
                      placeholder="Paste QR code value here..."
                      value={qrCode}
                      onChange={e => setQrCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleQrScan()}
                    />
                    <button className="btn btn-solid-cyan" onClick={handleQrScan}>SCAN</button>
                  </div>
                </div>

                {/* Visual QR Frame */}
                <div className="flex-center" style={{ marginBottom: '24px' }}>
                  <div className="qr-frame">
                    <div className="qr-corner tl" />
                    <div className="qr-corner tr" />
                    <div className="qr-corner bl" />
                    <div className="qr-corner br" />
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em', textAlign: 'center' }}>
                      📱<br />SCAN TICKET QR
                    </div>
                  </div>
                </div>

                {qrResult && (
                  <div className={`alert alert-${qrResult.success ? 'success' : 'error'}`}>
                    {qrResult.success
                      ? `✓ VALID — Ticket for: ${qrResult.data?.event_title || 'event'}`
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
