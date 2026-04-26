import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function BookingCalendar({ bookings, availableDates, onToggleDate, onRespond }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const toKey = (day) => new Date(year, month, day).toISOString().split('T')[0];
  const isPast = (day) =>
    day ? new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;

  const getBookingsForDay = (day) => {
    if (!day) return [];
    const key = toKey(day);
    return bookings.filter((b) => {
      if (!b.event_date) return false;
      return new Date(b.event_date).toISOString().split('T')[0] === key;
    });
  };

  const handleDayClick = (day) => {
    if (!day || isPast(day)) return;
    const key = toKey(day);
    const dayBookings = getBookingsForDay(day);
    if (dayBookings.length > 0) setSelected(selected === key ? null : key);
    else onToggleDate(key);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
        <div style={{ fontFamily: 'var(--text-display)', color: 'var(--gold)', letterSpacing: '0.12em' }}>
          {viewDate.toLocaleString('default', { month: 'long' }).toUpperCase()} {year}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--text-mono)', color: 'var(--text-dim)', fontSize: 10, padding: '6px 0' }}>{d}</div>
        ))}

        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const key = toKey(day);
          const dayBookings = getBookingsForDay(day);
          const available = availableDates.includes(key);
          const pending = dayBookings.some((b) => !b.status || b.status === 'pending');
          const accepted = dayBookings.some((b) => b.status === 'accepted');
          const rejected = dayBookings.some((b) => b.status === 'rejected');

          let bg = 'rgba(255,255,255,0.03)';
          let border = '1px solid rgba(255,255,255,0.06)';
          if (accepted) { bg = 'rgba(0,200,255,0.12)'; border = '1px solid rgba(0,200,255,0.35)'; }
          else if (rejected) { bg = 'rgba(255,80,80,0.1)'; border = '1px solid rgba(255,80,80,0.3)'; }
          else if (pending) { bg = 'rgba(255,179,0,0.15)'; border = '1px solid rgba(255,179,0,0.45)'; }
          else if (available) { bg = 'rgba(0,200,120,0.12)'; border = '1px solid rgba(0,200,120,0.4)'; }

          return (
            <div key={idx} onClick={() => handleDayClick(day)} style={{ minHeight: 54, borderRadius: 8, padding: 6, background: bg, border, opacity: isPast(day) ? 0.4 : 1, cursor: isPast(day) ? 'default' : 'pointer' }}>
              <div style={{ fontFamily: 'var(--text-mono)', color: 'var(--text-secondary)', fontSize: 11 }}>{day}</div>
              {dayBookings.length > 0 && <div style={{ marginTop: 5, fontSize: 10, color: 'var(--gold)' }}>{dayBookings.length} request</div>}
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="stat-label">REQUESTS FOR {selected}</div>
          {bookings
            .filter((b) => b.event_date && new Date(b.event_date).toISOString().split('T')[0] === selected)
            .map((b) => (
              <div key={b.booking_id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <strong>{b.organizer_name || 'Organizer'}</strong>
                  <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{(b.status || 'PENDING').toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {b.venue || '—'} · ৳{Number(b.proposed_fee || 0).toLocaleString()}</div>
                {(!b.status || b.status === 'pending') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => onRespond(b.booking_id, 'accepted')}>ACCEPT</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onRespond(b.booking_id, 'rejected')}>DECLINE</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
      {product.image ? (
        <img src={product.image} alt={product.name} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
      ) : (
        <div style={{ height: 130, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, marginBottom: 10 }}>🎵</div>
      )}
      <div style={{ fontFamily: 'var(--text-display)', fontSize: 14 }}>{product.name}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '6px 0' }}>{product.description || 'No description'}</div>
      {product.event_title && <div style={{ color: 'var(--cyan)', fontSize: 11, marginBottom: 6 }}>Concert: {product.event_title}</div>}
      <div className="flex-between">
        <strong style={{ color: 'var(--gold)' }}>৳{Number(product.price || 0).toLocaleString()}</strong>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Stock: {product.stock}</span>
      </div>
    </div>
  );
}

function OrdersPanel({ orders, onStatus }) {
  if (!orders.length) {
    return <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">NO PRODUCT ORDERS</div><div className="empty-sub">Orders for your music products will appear here.</div></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((order) => (
        <div key={order.order_id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
          <div className="flex-between" style={{ marginBottom: 8, gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--text-display)', fontSize: 14 }}>{order.product_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Buyer: {order.buyer_name || '—'} · Qty: {order.quantity} · ৳{Number(order.total_price || 0).toLocaleString()}</div>
            </div>
            <span className={`badge ${order.order_status === 'accepted' ? 'badge-green' : order.order_status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{(order.order_status || 'PENDING').toUpperCase()}</span>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            📍 {order.delivery_address}<br />
            📞 {order.delivery_phone} · Receiver: {order.delivery_name}<br />
            Payment: {order.payment_method} · {order.payment_status}{order.transaction_id ? ` · TXN: ${order.transaction_id}` : ''}
          </div>

          {(!order.order_status || order.order_status === 'pending') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => onStatus(order.order_id, 'accepted')}>ACCEPT</button>
              <button className="btn btn-danger btn-sm" onClick={() => onStatus(order.order_id, 'rejected')}>REJECT</button>
            </div>
          )}

          {order.order_status === 'accepted' && <button className="btn btn-ghost btn-sm" onClick={() => onStatus(order.order_id, 'delivered')}>Mark Delivered</button>}
        </div>
      ))}
    </div>
  );
}

export default function SingerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('BOOKINGS');
  const [alert, setAlert] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [profileForm, setProfileForm] = useState({ genre: '', bio: '', booking_fee: '', available: true });

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3500);
  };

  const refresh = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get('/events/bookings/mine').catch(() => ({ data: [] })),
      api.get('/users/me').catch(() => ({ data: {} })),
      api.get('/market/my-products').catch(() => ({ data: [] })),
      api.get('/market/orders/manage').catch(() => ({ data: [] })),
      api.get('/users/singer/availability').catch(() => ({ data: [] })),
      api.get('/users/singer/shows').catch(() => ({ data: [] })),
    ])
      .then(([bookingsRes, meRes, productsRes, ordersRes, availRes, showsRes]) => {
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);

        const me = meRes.data || {};
        setProfile(me);
        setProfileForm({
          genre: me.genre || '',
          bio: me.bio || '',
          booking_fee: me.booking_fee || me.fixed_fee || '',
          available: me.available !== false,
        });

        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setAvailableDates(Array.isArray(availRes.data) ? availRes.data : []);
        setEvents(Array.isArray(showsRes.data) ? showsRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleProfileUpdate = async () => {
    try {
      await api.put('/users/singer-profile', profileForm);
      setProfile((prev) => ({ ...prev, ...profileForm }));
      setEditMode(false);
      showAlert('success', 'Profile updated successfully');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleBookingRespond = async (bookingId, status) => {
    try {
      await api.put(`/events/booking/${bookingId}/respond`, { status });
      setBookings((prev) => prev.map((b) => (b.booking_id === bookingId ? { ...b, status } : b)));
      showAlert('success', `Booking ${status}`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to respond');
    }
  };

  const handleToggleDate = async (dateKey) => {
    const next = availableDates.includes(dateKey)
      ? availableDates.filter((date) => date !== dateKey)
      : [...availableDates, dateKey];

    setAvailableDates(next);

    try {
      await api.put('/users/singer/availability', { dates: next });
    } catch {
      setAvailableDates(availableDates);
      showAlert('error', 'Failed to update availability');
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/market/orders/${orderId}/status`, { status });
      showAlert('success', `Order ${status}`);
      refresh();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update order');
    }
  };

  const TABS = ['BOOKINGS', 'CALENDAR', 'SHOWS', 'PROFILE', 'PRODUCTS', 'ORDERS'];
  const pendingCount = bookings.filter((b) => !b.status || b.status === 'pending').length;
  const acceptedCount = bookings.filter((b) => b.status === 'accepted').length;
  const pendingOrders = orders.filter((o) => !o.order_status || o.order_status === 'pending').length;

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 6 }}>Artist Control Panel</div>

          <div className="flex-between">
            <h1 style={{ fontFamily: 'var(--text-display)', fontSize: 22, color: 'var(--gold)', letterSpacing: '0.08em', textShadow: 'var(--gold-glow)' }}>SINGER DASHBOARD</h1>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace/add')}>+ Add Marketplace Product</button>
              <button className="btn btn-ghost btn-sm" onClick={refresh}>⟳ Refresh</button>
            </div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>{alert.text}</div>}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
          <div className="stat-card gold"><div><div className="stat-label">Pending Bookings</div><div className="stat-value">{pendingCount}</div></div><div className="stat-icon">📬</div></div>
          <div className="stat-card green"><div><div className="stat-label">Accepted</div><div className="stat-value">{acceptedCount}</div></div><div className="stat-icon">✓</div></div>
          <div className="stat-card cyan"><div><div className="stat-label">Products</div><div className="stat-value">{products.length}</div></div><div className="stat-icon">🛍️</div></div>
          <div className="stat-card red"><div><div className="stat-label">Product Orders</div><div className="stat-value">{pendingOrders}</div></div><div className="stat-icon">📦</div></div>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {TABS.map((tab) => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab}
                {tab === 'BOOKINGS' && pendingCount > 0 && <span style={{ marginLeft: 6, background: '#ffb300', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{pendingCount}</span>}
                {tab === 'ORDERS' && pendingOrders > 0 && <span style={{ marginLeft: 6, background: '#ff5252', color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>{pendingOrders}</span>}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: 40 }}><div className="spinner" /></div>
            ) : activeTab === 'BOOKINGS' ? (
              bookings.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📬</div><div className="empty-title">NO BOOKING REQUESTS YET</div><div className="empty-sub">Organizers will contact you here.</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.map((b) => (
                    <div key={b.booking_id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <strong>{b.organizer_name || 'Organizer'}</strong>
                        <span className={`badge ${b.status === 'accepted' ? 'badge-green' : b.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>{(b.status || 'PENDING').toUpperCase()}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--text-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>📅 {formatDate(b.event_date)} · 📍 {b.venue || '—'} · ৳{Number(b.proposed_fee || 0).toLocaleString()}</div>
                      {b.message && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, fontStyle: 'italic' }}>"{b.message}"</div>}
                      {(!b.status || b.status === 'pending') && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleBookingRespond(b.booking_id, 'accepted')}>ACCEPT</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleBookingRespond(b.booking_id, 'rejected')}>DECLINE</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'CALENDAR' ? (
              <BookingCalendar bookings={bookings} availableDates={availableDates} onToggleDate={handleToggleDate} onRespond={handleBookingRespond} />
            ) : activeTab === 'SHOWS' ? (
              events.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎤</div><div className="empty-title">NO SHOWS YET</div><div className="empty-sub">Accepted events will appear here.</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {events.map((e) => (
                    <div key={e.event_id || e.id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
                      <div className="flex-between"><strong>{e.title}</strong><span className="badge badge-green">{(e.status || 'UPCOMING').toUpperCase()}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📅 {formatDate(e.date)} · 📍 {e.venue || '—'}</div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'PROFILE' ? (
              <div style={{ maxWidth: 560 }}>
                {editMode ? (
                  <>
                    <div className="form-group"><label className="form-label">Genre</label><input className="form-control" value={profileForm.genre} onChange={(e) => setProfileForm((p) => ({ ...p, genre: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Bio</label><textarea className="form-control" rows={4} value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Booking Fee</label><input className="form-control" type="number" value={profileForm.booking_fee} onChange={(e) => setProfileForm((p) => ({ ...p, booking_fee: e.target.value }))} /></div>
                    <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={handleProfileUpdate}>SAVE PROFILE</button><button className="btn btn-ghost" onClick={() => setEditMode(false)}>CANCEL</button></div>
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Name', value: user?.username || user?.unique_username || '—' },
                      { label: 'Email', value: profile.email || '—' },
                      { label: 'Genre', value: profile.genre || '—' },
                      { label: 'Bio', value: profile.bio || '—' },
                      { label: 'Booking Fee', value: profile.booking_fee || profile.fixed_fee ? `৳${Number(profile.booking_fee || profile.fixed_fee).toLocaleString()}` : '—' },
                    ].map((row) => (
                      <div key={row.label} style={{ padding: '12px 0', borderBottom: 'var(--border-dim)', display: 'flex', gap: 20 }}>
                        <div style={{ width: 110, fontFamily: 'var(--text-mono)', color: 'var(--text-dim)', fontSize: 10 }}>{row.label}</div>
                        <div>{row.value}</div>
                      </div>
                    ))}
                    <button className="btn btn-gold btn-sm" style={{ marginTop: 16 }} onClick={() => setEditMode(true)}>EDIT PROFILE</button>
                  </>
                )}
              </div>
            ) : activeTab === 'PRODUCTS' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><button className="btn btn-primary btn-sm" onClick={() => navigate('/marketplace/add')}>+ Add Product</button></div>
                {products.length === 0 ? (
                  <div className="empty-state"><div className="empty-icon">🛍️</div><div className="empty-title">NO PRODUCTS ADDED</div><div className="empty-sub">Add guitar, music disk, instrument, merch or concert products.</div></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>{products.map((p) => <ProductCard key={p.product_id} product={p} />)}</div>
                )}
              </>
            ) : (
              <OrdersPanel orders={orders.product_name} onStatus={handleOrderStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
