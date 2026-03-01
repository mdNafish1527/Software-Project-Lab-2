import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('Overview');
  const [events, setEvents] = useState([]);
  const [singers, setSingers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [bookingForm, setBookingForm] = useState({ singer_id: '', date: '', venue: '', city: '' });
  const [eventForm, setEventForm] = useState({
    booking_id: '', title: '', description: '', poster: '',
    tier1_price: '', tier1_quantity: '', tier2_price: '', tier2_quantity: '',
    tier3_price: '', tier3_quantity: '', dynamic_pricing_enable: false
  });

  useEffect(() => {
    if (!user || user.role !== 'organizer') { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, sRes] = await Promise.all([
        API.get('/events/organizer/mine'),
        API.get('/users/singers'),
      ]);
      setEvents(evRes.data);
      setSingers(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/events/booking', bookingForm);
      toast.success('Booking request sent to singer!');
      setBookingForm({ singer_id: '', date: '', venue: '', city: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handlePayBooking = async (booking_id) => {
    try {
      await API.post(`/events/booking/${booking_id}/pay`);
      toast.success('Payment successful! Now create your concert.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/events', eventForm);
      toast.success('Concert created!');
      loadData();
      setActive('My Events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLaunch = async (event_id) => {
    try {
      await API.post(`/events/${event_id}/launch`);
      toast.success('Concert is now LIVE! 🎉');
      loadData();
    } catch (err) {
      toast.error('Failed to launch');
    }
  };

  const menuItems = ['Overview', 'Book Singer', 'Create Event', 'My Events', 'QR Scanner', 'Marketplace', 'Profile'];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div style={{ padding: '8px 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{user?.username}</p>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Organizer</p>
            </div>
          </div>
        </div>
        <p className="sidebar-label">Management</p>
        {menuItems.map(m => (
          <button key={m} className={`sidebar-link ${active === m ? 'active' : ''}`} onClick={() => setActive(m)}>
            {({ 'Overview':'📊', 'Book Singer':'🎤', 'Create Event':'🎪', 'My Events':'📋', 'QR Scanner':'📷', 'Marketplace':'🛍️', 'Profile':'👤' }[m])} {m}
          </button>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
        <button className="sidebar-link" onClick={() => { logout(); navigate('/'); }} style={{ color: 'var(--red)' }}>🚪 Logout</button>
      </aside>

      <main className="main-content">
        {active === 'Overview' && (
          <div>
            <h2 style={{ marginBottom: 8 }}>Welcome, {user?.username}! 🎪</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Manage your concerts and bookings.</p>
            <div className="grid grid-3" style={{ marginBottom: 32 }}>
              <div className="stat-card"><div className="stat-value">{events.length}</div><div className="stat-label">Total Events</div></div>
              <div className="stat-card"><div className="stat-value">{events.filter(e => e.status === 'live').length}</div><div className="stat-label">Live Now</div></div>
              <div className="stat-card"><div className="stat-value">{singers.length}</div><div className="stat-label">Available Singers</div></div>
            </div>
            <h3 style={{ marginBottom: 16 }}>Recent Events</h3>
            {events.slice(0, 3).map(e => (
              <div key={e.event_id} className="card" style={{ marginBottom: 12 }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{e.title}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{e.city} · {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`badge ${e.status === 'live' ? 'badge-green' : e.status === 'approved' ? 'badge-gold' : 'badge-gray'}`}>{e.status}</span>
                    {e.status === 'approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleLaunch(e.event_id)}>🚀 Launch</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {active === 'Book Singer' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ marginBottom: 8 }}>Book a Singer</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Send a booking request to a singer for your event.</p>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleBookingRequest}>
                  <div className="form-group">
                    <label>Select Singer</label>
                    <select className="form-control" value={bookingForm.singer_id}
                      onChange={e => setBookingForm({ ...bookingForm, singer_id: e.target.value })} required>
                      <option value="">-- Choose Singer --</option>
                      {singers.filter(s => s.availability === 'available').map(s => (
                        <option key={s.u_id} value={s.u_id}>{s.unique_username} — ৳{s.fixed_fee || 'N/A'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Event Date</label>
                    <input type="date" className="form-control" value={bookingForm.date}
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Venue</label>
                    <input className="form-control" placeholder="Venue name" value={bookingForm.venue}
                      onChange={e => setBookingForm({ ...bookingForm, venue: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" placeholder="Dhaka, Chittagong..." value={bookingForm.city}
                      onChange={e => setBookingForm({ ...bookingForm, city: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Booking Request</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {active === 'Create Event' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ marginBottom: 8 }}>Create Concert</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Fill in the concert details after your booking is paid.</p>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleCreateEvent}>
                  <div className="form-group">
                    <label>Booking ID (paid)</label>
                    <input className="form-control" placeholder="Booking ID" value={eventForm.booking_id}
                      onChange={e => setEventForm({ ...eventForm, booking_id: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Concert Title</label>
                    <input className="form-control" placeholder="Echoes of Dhaka..." value={eventForm.title}
                      onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" rows={3} value={eventForm.description}
                      onChange={e => setEventForm({ ...eventForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Poster URL</label>
                    <input className="form-control" placeholder="https://..." value={eventForm.poster}
                      onChange={e => setEventForm({ ...eventForm, poster: e.target.value })} />
                  </div>
                  <div className="grid grid-2">
                    {[1, 2, 3].map(t => (
                      <React.Fragment key={t}>
                        <div className="form-group">
                          <label>Tier {t} Price (৳)</label>
                          <input type="number" className="form-control" value={eventForm[`tier${t}_price`]}
                            onChange={e => setEventForm({ ...eventForm, [`tier${t}_price`]: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Tier {t} Quantity</label>
                          <input type="number" className="form-control" value={eventForm[`tier${t}_quantity`]}
                            onChange={e => setEventForm({ ...eventForm, [`tier${t}_quantity`]: e.target.value })} />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="dynPrice" checked={eventForm.dynamic_pricing_enable}
                      onChange={e => setEventForm({ ...eventForm, dynamic_pricing_enable: e.target.checked })} />
                    <label htmlFor="dynPrice" style={{ margin: 0, textTransform: 'none', fontSize: 14, color: 'var(--text)' }}>Enable Dynamic Pricing</label>
                  </div>
                  <button type="submit" className="btn btn-primary">🎪 Create Concert</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {active === 'My Events' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>My Events</h2>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <p>No events yet. <button className="btn btn-outline btn-sm" onClick={() => setActive('Book Singer')}>Book a Singer</button></p>
              </div>
            ) : events.map(e => (
              <div key={e.event_id} className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{e.title}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: 13 }}>📍 {e.venue}, {e.city} · 📅 {new Date(e.date).toLocaleDateString()}</p>
                      <div style={{ marginTop: 8 }}>
                        {e.tier1_price && <span className="tier-pill" style={{ marginRight: 6 }}>T1: ৳{e.tier1_price}</span>}
                        {e.tier2_price && <span className="tier-pill" style={{ marginRight: 6 }}>T2: ৳{e.tier2_price}</span>}
                        {e.tier3_price && <span className="tier-pill">T3: ৳{e.tier3_price}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span className={`badge ${e.status === 'live' ? 'badge-green' : e.status === 'approved' ? 'badge-gold' : 'badge-gray'}`}>{e.status}</span>
                      {e.status === 'approved' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleLaunch(e.event_id)}>🚀 Go Live</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {active === 'QR Scanner' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ marginBottom: 8 }}>QR Scanner</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Scan attendee QR codes at the venue.</p>
            <QRScannerPanel />
          </div>
        )}

        {active === 'Profile' && (
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ marginBottom: 24 }}>My Profile</h2>
            <div className="card">
              <div className="card-body">
                <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Role: <strong style={{ color: 'var(--gold)' }}>Organizer</strong></p>
                <p style={{ color: 'var(--muted)' }}>Email: <strong style={{ color: 'var(--text)' }}>{user?.email}</strong></p>
              </div>
            </div>
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-body">
                <h4 style={{ marginBottom: 16 }}>Change Password</h4>
                <ChangePasswordForm />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const QRScannerPanel = () => {
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await API.post('/tickets/scan', { qr_code: qrCode, device: 'web' });
      setResult({ type: 'success', message: res.data.message });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || 'Scan failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="scanner-box" style={{ marginBottom: 20 }}>
        <div className="scanner-icon">📷</div>
        <p style={{ color: 'var(--muted)' }}>Enter QR code manually below</p>
        <p style={{ color: 'var(--muted)', fontSize: 12 }}>(In production: use a camera QR scanner library)</p>
      </div>
      <form onSubmit={handleScan}>
        <div className="form-group">
          <label>QR Code Value</label>
          <input className="form-control" placeholder="Paste or type QR code..."
            value={qrCode} onChange={e => setQrCode(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Scanning...' : '🔍 Verify Ticket'}
        </button>
      </form>
      {result && (
        <div className={`alert ${result.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 20 }}>
          {result.type === 'success' ? '✅' : '❌'} {result.message}
        </div>
      )}
    </div>
  );
};

const ChangePasswordForm = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/change-password', form);
      toast.success('Password changed!');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Current Password</label>
        <input className="form-control" type="password" value={form.currentPassword}
          onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
      </div>
      <div className="form-group">
        <label>New Password</label>
        <input className="form-control" type="password" value={form.newPassword}
          onChange={e => setForm({ ...form, newPassword: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-outline btn-sm">Update Password</button>
    </form>
  );
};

export default OrganizerDashboard;