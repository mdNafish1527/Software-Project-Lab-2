import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const SingerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('Overview');
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({});
  const [singerProfile, setSingerProfile] = useState({ bio: '', fixed_fee: '', availability: 'available', genre: '' });
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({ name: '', type: '', description: '', price: '', stock_quantity: '', photo: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'singer') { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        API.get('/events/bookings/mine'),
        API.get('/users/me'),
      ]);
      setBookings(bRes.data);
      setProfile(pRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleBookingResponse = async (booking_id, action) => {
    try {
      await API.put(`/events/booking/${booking_id}/respond`, { action });
      toast.success(`Booking ${action}`);
      loadData();
    } catch (err) { toast.error('Failed'); }
  };

  const handleUpdateSingerProfile = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/singer-profile', singerProfile);
      toast.success('Profile updated!');
    } catch (err) { toast.error('Update failed'); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await API.post('/marketplace', itemForm);
      toast.success('Item added to marketplace!');
      setItemForm({ name: '', type: '', description: '', price: '', stock_quantity: '', photo: '' });
    } catch (err) { toast.error('Failed'); }
  };

  const menu = ['Overview', 'Bookings', 'My Profile', 'Marketplace', 'Change Password'];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div style={{ padding: '8px 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profile.profile_picture && (
              <img src={profile.profile_picture} alt={user?.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
            )}
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{user?.username}</p>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Singer</p>
            </div>
          </div>
        </div>
        <p className="sidebar-label">Dashboard</p>
        {menu.map(m => (
          <button key={m} className={`sidebar-link ${active === m ? 'active' : ''}`} onClick={() => setActive(m)}>
            {({ 'Overview':'🎵', 'Bookings':'📅', 'My Profile':'🎤', 'Marketplace':'🛍️', 'Change Password':'🔒' }[m])} {m}
          </button>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
        <button className="sidebar-link" onClick={() => { logout(); navigate('/'); }} style={{ color: 'var(--red)' }}>🚪 Logout</button>
      </aside>

      <main className="main-content">
        {active === 'Overview' && (
          <div>
            <h2 style={{ marginBottom: 8 }}>Hello, {user?.username}! 🎵</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Manage your bookings and profile.</p>
            <div className="grid grid-3">
              <div className="stat-card"><div className="stat-value">{bookings.length}</div><div className="stat-label">Total Bookings</div></div>
              <div className="stat-card"><div className="stat-value">{bookings.filter(b => b.status === 'accepted').length}</div><div className="stat-label">Accepted</div></div>
              <div className="stat-card"><div className="stat-value">{bookings.filter(b => b.status === 'pending').length}</div><div className="stat-label">Pending</div></div>
            </div>

            <h3 style={{ margin: '28px 0 14px' }}>Recent Booking Requests</h3>
            {bookings.slice(0, 3).map(b => (
              <BookingCard key={b.booking_id} booking={b} onRespond={handleBookingResponse} />
            ))}
          </div>
        )}

        {active === 'Bookings' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>📅 Booking Requests</h2>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No booking requests yet.</div>
            ) : bookings.map(b => (
              <BookingCard key={b.booking_id} booking={b} onRespond={handleBookingResponse} />
            ))}
          </div>
        )}

        {active === 'My Profile' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ marginBottom: 24 }}>🎤 Singer Profile</h2>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleUpdateSingerProfile}>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea className="form-control" rows={4} value={singerProfile.bio}
                      onChange={e => setSingerProfile({ ...singerProfile, bio: e.target.value })} placeholder="Tell your story..." />
                  </div>
                  <div className="form-group">
                    <label>Fixed Fee (৳)</label>
                    <input type="number" className="form-control" value={singerProfile.fixed_fee}
                      onChange={e => setSingerProfile({ ...singerProfile, fixed_fee: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Genre</label>
                    <input className="form-control" placeholder="Bangla Folk, Rock, Classical..." value={singerProfile.genre}
                      onChange={e => setSingerProfile({ ...singerProfile, genre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Availability</label>
                    <select className="form-control" value={singerProfile.availability}
                      onChange={e => setSingerProfile({ ...singerProfile, availability: e.target.value })}>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">Save Profile</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {active === 'Marketplace' && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ marginBottom: 24 }}>🛍️ Add Merchandise</h2>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleAddItem}>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label>Item Name</label>
                      <input className="form-control" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <input className="form-control" placeholder="T-shirt, Album, Poster..." value={itemForm.type}
                        onChange={e => setItemForm({ ...itemForm, type: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Price (৳)</label>
                      <input type="number" className="form-control" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input type="number" className="form-control" value={itemForm.stock_quantity} onChange={e => setItemForm({ ...itemForm, stock_quantity: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" rows={3} value={itemForm.description}
                      onChange={e => setItemForm({ ...itemForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Photo URL</label>
                    <input className="form-control" placeholder="https://..." value={itemForm.photo}
                      onChange={e => setItemForm({ ...itemForm, photo: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary">Add to Marketplace</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {active === 'Change Password' && (
          <div style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 24 }}>🔒 Change Password</h2>
            <div className="card"><div className="card-body"><ChangePasswordForm /></div></div>
          </div>
        )}
      </main>
    </div>
  );
};

const BookingCard = ({ booking, onRespond }) => (
  <div className="card" style={{ marginBottom: 14 }}>
    <div className="card-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontWeight: 600 }}>From: {booking.organizer_name}</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>📍 {booking.venue}, {booking.city}</p>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>📅 {new Date(booking.date).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span className={`badge ${booking.status === 'accepted' ? 'badge-green' : booking.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
            {booking.status}
          </span>
          {booking.status === 'pending' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => onRespond(booking.booking_id, 'accepted')}>Accept</button>
              <button className="btn btn-danger btn-sm" onClick={() => onRespond(booking.booking_id, 'rejected')}>Reject</button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

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

export default SingerDashboard;