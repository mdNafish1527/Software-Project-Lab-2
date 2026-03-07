import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

export default function SingerDashboard() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BOOKINGS');
  const [alert, setAlert] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ genre: '', bio: '', booking_fee: '', available: true });

  useEffect(() => {
    Promise.all([
      api.get('/events/bookings/mine').catch(() => ({ data: [] })),
      api.get('/users/me').catch(() => ({ data: {} })),
      api.get('/marketplace').catch(() => ({ data: [] })),
    ]).then(([b, me, mkt]) => {
      setBookings(b.data || []);
      setProfile(me.data || {});
      setProfileForm({
        genre: me.data?.genre || '',
        bio: me.data?.bio || '',
        booking_fee: me.data?.booking_fee || '',
        available: me.data?.available !== false
      });
      const myItems = (mkt.data || []).filter(i => i.seller_id === user?.id);
      setItems(myItems);
    }).finally(() => setLoading(false));
  }, [user?.id]);

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
    } catch { showAlert('error', 'Failed to update profile'); }
  };

  const handleBookingRespond = async (id, status) => {
    try {
      await api.put(`/events/booking/${id}/respond`, { status });
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status } : bk));
      showAlert('success', `Booking ${status}`);
    } catch { showAlert('error', 'Failed to respond to booking'); }
  };

  const statusBadge = (status) => {
    if (status === 'accepted') return 'badge-green';
    if (status === 'rejected') return 'badge-red';
    return 'badge-gold';
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Artist Control Panel
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--gold)',
              letterSpacing: '0.08em', textShadow: 'var(--gold-glow)'
            }}>
              ARTIST DASHBOARD
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-md" style={{
                background: 'var(--gold-dim)', border: '2px solid rgba(255,179,0,0.4)',
                color: 'var(--gold)', fontSize: '16px', width: '40px', height: '40px'
              }}>
                {user?.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>{user?.name}</div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>ARTIST</div>
              </div>
            </div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card gold">
            <div><div className="stat-label">Booking Requests</div><div className="stat-value">{bookings.length}</div></div>
            <div className="stat-icon">📬</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Accepted</div><div className="stat-value">{bookings.filter(b => b.status === 'accepted').length}</div></div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-card cyan">
            <div><div className="stat-label">Merch Listed</div><div className="stat-value">{items.length}</div></div>
            <div className="stat-icon">🛒</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {['BOOKINGS', 'PROFILE', 'MERCH'].map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab}
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
                  <div className="empty-title">NO BOOKING REQUESTS</div>
                  <div className="empty-sub">Organizers will contact you when they want to book you</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bookings.map(b => (
                    <div key={b.id} style={{
                      background: 'var(--bg-secondary)', border: 'var(--border-dim)',
                      borderRadius: 'var(--radius-sm)', padding: '16px'
                    }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {b.organizer_name || 'Organizer'}
                        </div>
                        <span className={`badge ${statusBadge(b.status)}`}>
                          {(b.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Event Date: {b.proposed_date ? new Date(b.proposed_date).toLocaleDateString() : '—'}
                        &nbsp;&nbsp;•&nbsp;&nbsp;
                        Fee: ৳{b.offered_fee?.toLocaleString() || '—'}
                      </div>
                      {(!b.status || b.status === 'pending') && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleBookingRespond(b.id, 'accepted')}>
                            ✓ ACCEPT
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleBookingRespond(b.id, 'rejected')}>
                            ✗ DECLINE
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
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
                      { label: 'Genre', value: profile.genre || '—' },
                      { label: 'Bio', value: profile.bio || '—' },
                      { label: 'Booking Fee', value: profile.booking_fee ? `৳${profile.booking_fee?.toLocaleString()}` : '—' },
                      { label: 'Email', value: profile.email || '—' },
                    ].map(row => (
                      <div key={row.label} style={{
                        padding: '12px 0', borderBottom: 'var(--border-dim)',
                        display: 'flex', gap: '20px'
                      }}>
                        <div style={{
                          fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: 'var(--text-dim)', width: '100px', flexShrink: 0, paddingTop: '2px'
                        }}>
                          {row.label}
                        </div>
                        <div style={{ fontFamily: 'var(--text-body)', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {row.value}
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-gold btn-sm" style={{ marginTop: '16px' }} onClick={() => setEditMode(true)}>
                      EDIT PROFILE
                    </button>
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
