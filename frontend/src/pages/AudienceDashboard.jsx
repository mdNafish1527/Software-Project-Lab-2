import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const tabs = ['My Tickets', 'Orders', 'Profile'];

const AudienceDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('My Tickets');
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'audience') { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, oRes, pRes] = await Promise.all([
        API.get('/tickets/mine'),
        API.get('/marketplace/orders/mine'),
        API.get('/users/me'),
      ]);
      setTickets(tRes.data);
      setOrders(oRes.data);
      setProfile(pRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/me', { username: profile.unique_username, mobile_banking_number: profile.mobile_banking_number });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '8px 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 14 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{user?.username}</p>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Audience</p>
            </div>
          </div>
        </div>
        <p className="sidebar-label">Menu</p>
        {tabs.map(tab => (
          <button key={tab} className={`sidebar-link ${active === tab ? 'active' : ''}`} onClick={() => setActive(tab)}>
            {tab === 'My Tickets' ? '🎟️' : tab === 'Orders' ? '📦' : '👤'} {tab}
          </button>
        ))}
        <Link to="/concerts" className="sidebar-link">🎭 Browse Concerts</Link>
        <Link to="/marketplace" className="sidebar-link">🛍️ Marketplace</Link>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
        <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--red)' }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {loading && <div className="spinner" />}

        {!loading && active === 'My Tickets' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>🎟️ My Tickets</h2>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎭</div>
                <p>No tickets yet. <Link to="/concerts">Browse concerts</Link></p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tickets.map(t => (
                  <div key={t.ticket_id} className="ticket-card">
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: 6 }}>{t.event_title}</h4>
                      <p style={{ color: 'var(--muted)', fontSize: 13 }}>📍 {t.venue}, {t.city}</p>
                      <p style={{ color: 'var(--muted)', fontSize: 13 }}>📅 {new Date(t.date).toLocaleDateString()}</p>
                      <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="tier-pill">Tier {t.tier}</span>
                        <span className="tier-pill">৳{t.price}</span>
                        <span className={`badge ${t.used ? 'badge-red' : 'badge-green'}`}>
                          {t.used ? 'Used' : 'Valid'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>QR Code</p>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--gold)', wordBreak: 'break-all', maxWidth: 100 }}>
                        {t.qr_code.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && active === 'Orders' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>📦 My Orders</h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛍️</div>
                <p>No orders yet. <Link to="/marketplace">Visit Marketplace</Link></p>
              </div>
            ) : orders.map(o => (
              <div key={o.order_id} className="card" style={{ marginBottom: 16 }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 600 }}>Order #{o.order_id}</span>
                    <span className={`badge ${o.status === 'delivered' ? 'badge-green' : 'badge-gold'}`}>{o.status}</span>
                  </div>
                  {o.items?.map(item => (
                    <div key={item.order_item_id} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg3)', overflow: 'hidden' }}>
                        {item.photo && <img src={item.photo} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 500 }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Qty: {item.quantity} × ৳{item.price}</p>
                      </div>
                    </div>
                  ))}
                  <hr className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Total (incl. shipping)</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold)' }}>৳{o.total_amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && active === 'Profile' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ marginBottom: 24 }}>👤 My Profile</h2>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleProfileUpdate}>
                  <div className="form-group">
                    <label>Username</label>
                    <input className="form-control" value={profile.unique_username || ''}
                      onChange={e => setProfile({ ...profile, unique_username: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" value={profile.email || ''} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="form-group">
                    <label>Mobile Banking Number</label>
                    <input className="form-control" placeholder="01XXXXXXXXX"
                      value={profile.mobile_banking_number || ''}
                      onChange={e => setProfile({ ...profile, mobile_banking_number: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </form>
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

export default AudienceDashboard;