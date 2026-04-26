import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import MediaViewer from '../components/MediaViewer';

const STATUS_COLOR = {
  pending: '#D4A853',
  approved: '#00BFA6',
  live: '#ff4444',
  ended: '#888',
  cancelled: '#FF5252',
};

const COMPLAINT_STATUS_COLOR = {
  pending: { color: '#D4A853', bg: 'rgba(212,168,83,0.1)', border: 'rgba(212,168,83,0.3)' },
  reviewed: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)' },
  resolved: { color: '#00BFA6', bg: 'rgba(0,191,166,0.08)', border: 'rgba(0,191,166,0.25)' },
  dismissed: { color: '#888', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

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

function getEventId(event) {
  return event?.event_id || event?.id;
}

function normalizeArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function isPastDate(dateValue) {
  if (!dateValue) return true;

  const selectedDate = new Date(dateValue);
  if (Number.isNaN(selectedDate.getTime())) return true;

  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

function TicketSoldCell({ ev }) {
  const tiers = [
    {
      label: 'Standing',
      sold: Number(ev.tier1_sold || 0),
      cap: Number(ev.tier1_quantity || 0),
      color: 'var(--gold)',
    },
    {
      label: 'Chair',
      sold: Number(ev.tier2_sold || 0),
      cap: Number(ev.tier2_quantity || 0),
      color: 'var(--cyan)',
    },
    {
      label: 'Sofa',
      sold: Number(ev.tier3_sold || 0),
      cap: Number(ev.tier3_quantity || 0),
      color: '#b040ff',
    },
  ].filter((tier) => tier.cap > 0);

  if (!tiers.length) {
    return (
      <span style={{ fontFamily: 'var(--text-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
        —
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {tiers.map((tier) => {
        const pct = Math.min(Math.round((tier.sold / tier.cap) * 100), 100);

        return (
          <div key={tier.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--text-mono)',
                fontSize: 10,
                color: tier.color,
                width: 60,
                flexShrink: 0,
              }}
            >
              {tier.label}
            </span>

            <div
              style={{
                flex: 1,
                height: 5,
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 3,
                overflow: 'hidden',
                minWidth: 50,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: tier.color,
                  borderRadius: 3,
                }}
              />
            </div>

            <span style={{ fontFamily: 'var(--text-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
              {tier.sold}/{tier.cap}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BookArtistModal({ singers, onClose, onSuccess }) {
  const [form, setForm] = useState({
    singer_id: '',
    event_date: '',
    venue: '',
    proposed_fee: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const selected = singers.find((s) => String(s.u_id) === String(form.singer_id));

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.singer_id || !form.event_date || !form.venue) {
      setErr('Artist, date and venue are required');
      return;
    }

    if (isPastDate(form.event_date)) {
      setErr('Event date cannot be in the past');
      return;
    }
    setSubmitting(true);
    setErr('');

    try {
      await api.post('/events/booking', {
        singer_id: Number(form.singer_id),
        event_date: form.event_date,
        venue: form.venue,
        proposed_fee: Number(form.proposed_fee) || 0,
        message: form.message,
      });

      onSuccess();
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to send booking request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 520,
          width: '100%',
          padding: 28,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontFamily: 'var(--text-mono)',
            fontSize: 10,
            color: 'var(--cyan)',
            letterSpacing: '0.15em',
            marginBottom: 20,
          }}
        >
          SEND BOOKING REQUEST
        </div>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: 14 }}>
            {err}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Select Artist *</label>
          <select
            className="form-control"
            value={form.singer_id}
            onChange={(e) => update('singer_id', e.target.value)}
          >
            <option value="">— Choose an artist —</option>
            {singers.map((s) => (
              <option key={s.u_id} value={s.u_id}>
                {s.unique_username}
                {s.genre ? ` · ${s.genre}` : ''}
                {s.fixed_fee ? ` · ৳${Number(s.fixed_fee).toLocaleString()}/show` : ''}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(212,168,83,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--gold)' }}>{selected.unique_username}</strong>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {selected.genre || 'Artist'}
              {selected.fixed_fee > 0
                ? ` · ৳${Number(selected.fixed_fee).toLocaleString()}/show`
                : ' · Fee negotiable'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Proposed Event Date *</label>
            <input
              className="form-control"
              type="date"
              min={todayIso()}
              value={form.event_date}
              onChange={(e) => update('event_date', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Venue *</label>
            <input
              className="form-control"
              placeholder="e.g. TSC Auditorium"
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Proposed Fee</label>
            <input
              className="form-control"
              type="number"
              placeholder="e.g. 50000"
              value={form.proposed_fee}
              onChange={(e) => update('proposed_fee', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Message to Artist</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describe your event."
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Booking Request'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateEventFromBookingModal({ booking, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    poster: '',
    date: booking?.event_date ? String(booking.event_date).split('T')[0] : '',
    time: '19:00',
    venue: booking?.venue || '',
    city: booking?.city || 'Dhaka',
    tier1_price: '',
    tier1_quantity: '',
    tier2_price: '',
    tier2_quantity: '',
    tier3_price: '',
    tier3_quantity: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.title || !form.venue || !form.date) {
      setErr('Title, venue and date are required');
      return;
    }


    
    if (isPastDate(form.date)) {
  setErr('Event date cannot be in the past');
  return;
}

    if (!form.tier1_quantity || Number(form.tier1_quantity) === 0) {
      setErr('Standing section capacity is required');
      return;
    }

    setSubmitting(true);
    setErr('');

    try {
      const res = await api.post('/events', {
        booking_id: booking.booking_id,
        title: form.title,
        description: form.description,
        poster: form.poster,
        date: form.date,
        time: form.time || '19:00:00',
        venue: form.venue,
        city: form.city || 'Dhaka',
        tier1_price: Number(form.tier1_price) || 0,
        tier1_quantity: Number(form.tier1_quantity) || 0,
        tier2_price: Number(form.tier2_price) || 0,
        tier2_quantity: Number(form.tier2_quantity) || 0,
        tier3_price: Number(form.tier3_price) || 0,
        tier3_quantity: Number(form.tier3_quantity) || 0,
      });

      onCreated(res.data);
      onClose();
    } catch (error) {
      setErr(error.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,212,255,0.25)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 720,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stat-label" style={{ marginBottom: 8 }}>
          CREATE EVENT FROM ACCEPTED BOOKING
        </div>

        <h2 style={{ marginBottom: 10 }}>Finalize Event Details</h2>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Event Title *</label>
            <input
              className="form-control"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Venue *</label>
            <input
              className="form-control"
              value={form.venue}
              onChange={(e) => set('venue', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              className="form-control"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-control"
              type="date"
              min={todayIso()}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              className="form-control"
              type="time"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Poster Image URL</label>
            <input
              className="form-control"
              value={form.poster}
              onChange={(e) => set('poster', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>

        {[1, 2, 3].map((tier) => (
          <div
            key={tier}
            style={{
              background: 'var(--bg-secondary)',
              border: 'var(--border-dim)',
              borderRadius: 'var(--radius-sm)',
              padding: 14,
              marginBottom: 10,
            }}
          >
            <strong>{tier === 1 ? 'Standing' : tier === 2 ? 'Chair' : 'Sofa'}</strong>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <input
                className="form-control"
                type="number"
                placeholder="Price"
                value={form[`tier${tier}_price`]}
                onChange={(e) => set(`tier${tier}_price`, e.target.value)}
              />

              <input
                className="form-control"
                type="number"
                placeholder="Capacity"
                value={form[`tier${tier}_quantity`]}
                onChange={(e) => set(`tier${tier}_quantity`, e.target.value)}
              />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Event'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintQrModal({ event, onClose }) {
  const eventId = getEventId(event);

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .post(`/complaint-qr/${eventId}/generate`)
      .then((res) => setQrData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to generate QR'))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,212,255,0.2)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 420,
          width: '100%',
          padding: 28,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stat-label">COMPLAINT QR CODE</div>

        <h3 style={{ marginBottom: 18 }}>{event?.title || 'Event'}</h3>

        {loading && <div className="spinner" style={{ margin: '30px auto' }} />}

        {error && <div className="alert alert-error">{error}</div>}

        {qrData && (
          <>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'inline-block' }}>
              <img src={qrData.qr_image} alt="Complaint QR" style={{ width: 220, height: 220 }} />
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 11,
                color: 'var(--text-dim)',
                wordBreak: 'break-all',
              }}
            >
              {qrData.url}
            </div>

            <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: 'var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        padding: 14,
      }}
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name || 'Product'}
          style={{
            width: '100%',
            aspectRatio: '4 / 3',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
            borderRadius: 10,
            marginBottom: 10,
            background: 'var(--bg-panel)',
            display: 'block',
            padding: 6,
          }}
        />
      ) : (
        <div
          style={{
            aspectRatio: '4 / 3',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            marginBottom: 10,
          }}
        >
          🎵
        </div>
      )}

      <div style={{ fontFamily: 'var(--text-display)', fontSize: 14 }}>
        {product.name || 'Unnamed Product'}
      </div>

      <div style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '6px 0' }}>
        {product.description || 'No description'}
      </div>

      {product.event_title && (
        <div style={{ color: 'var(--cyan)', fontSize: 11, marginBottom: 6 }}>
          Concert: {product.event_title}
        </div>
      )}

      <div className="flex-between">
        <strong style={{ color: 'var(--gold)' }}>
          ৳{Number(product.price || 0).toLocaleString()}
        </strong>

        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Stock: {product.stock ?? 0}
        </span>
      </div>
    </div>
  );
}

function OrdersPanel({ orders = [], onStatus }) {
  const safeOrders = Array.isArray(orders) ? orders : [];

  if (!safeOrders.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <div className="empty-title">NO PRODUCT ORDERS</div>
        <div className="empty-sub">Orders for your marketplace products will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {safeOrders.map((order) => (
        <div
          key={order.order_id}
          style={{
            background: 'var(--bg-secondary)',
            border: 'var(--border-dim)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
          }}
        >
          <div className="flex-between" style={{ marginBottom: 8, gap: 10 }}>
            <div>
              <strong>{order.product_name || 'Unknown Product'}</strong>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Buyer: {order.buyer_name || '—'} · Qty: {order.quantity || 0} · ৳
                {Number(order.total_price || 0).toLocaleString()}
              </div>
            </div>

            <span
              className={`badge ${
                order.order_status === 'accepted'
                  ? 'badge-green'
                  : order.order_status === 'rejected'
                  ? 'badge-red'
                  : order.order_status === 'delivered'
                  ? 'badge-cyan'
                  : 'badge-gold'
              }`}
            >
              {(order.order_status || 'PENDING').toUpperCase()}
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 10,
            }}
          >
            📍 {order.delivery_address || 'No address'}
            <br />
            📞 {order.delivery_phone || 'No phone'} · Receiver: {order.delivery_name || '—'}
            <br />
            Payment: {order.payment_method || '—'} · {order.payment_status || '—'}
            {order.transaction_id ? ` · TXN: ${order.transaction_id}` : ''}
          </div>

          {(!order.order_status || order.order_status === 'pending') && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onStatus(order.order_id, 'accepted')}
              >
                ACCEPT
              </button>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => onStatus(order.order_id, 'rejected')}
              >
                REJECT
              </button>
            </div>
          )}

          {order.order_status === 'accepted' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onStatus(order.order_id, 'delivered')}
            >
              Mark Delivered
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [singers, setSingers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('EVENTS');
  const [alert, setAlert] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [showBookModal, setShowBookModal] = useState(false);
  const [createFromBooking, setCreateFromBooking] = useState(null);
  const [complainQrModal, setComplaintQrModal] = useState(null);

  const [qrCode, setQrCode] = useState('');
  const [qrResult, setQrResult] = useState(null);

  const refresh = () => {
    setRefreshKey((key) => key + 1);
  };

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4500);
  };

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get('/events/organizer/mine').catch(() => ({ data: [] })),
      api.get('/complaints/organizer/all').catch(() => ({ data: [] })),
      api.get('/events/organizer/bookings').catch(() => ({ data: [] })),
      api.get('/users/singers').catch(() => ({ data: [] })),
      api.get('/market/my-products').catch(() => ({ data: [] })),
      api.get('/market/orders/manage').catch(() => ({ data: [] })),
    ])
      .then(([eventsRes, complaintsRes, bookingsRes, singersRes, productsRes, ordersRes]) => {
        setEvents(normalizeArray(eventsRes.data, ['events', 'data']));
        setComplaints(normalizeArray(complaintsRes.data, ['complaints', 'data']));
        setBookings(normalizeArray(bookingsRes.data, ['bookings', 'data']));
        setSingers(normalizeArray(singersRes.data, ['singers', 'users', 'data']));
        setProducts(normalizeArray(productsRes.data, ['products', 'data']));
        setOrders(normalizeArray(ordersRes.data, ['orders', 'data']));
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleLaunch = async (event) => {
    const eventId = getEventId(event);

    try {
      await api.post(`/events/${eventId}/launch`);

      setEvents((prev) =>
        prev.map((row) =>
          getEventId(row) === eventId ? { ...row, status: 'live', launch: 1 } : row
        )
      );

      showAlert('success', `"${event.title}" is now live`);

      const addProduct = window.confirm(
        'Do you want to add concert-dedicated products like T-shirt, cap or poster for this event?'
      );

      if (addProduct) {
        navigate(`/marketplace/add?event_id=${eventId}`);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to launch event');
    }
  };

  const toggleDynamicPricing = async (eventId, current) => {
    try {
      const res = await api.put(`/events/${eventId}/dynamic-pricing`, {
        enabled: !current,
      });

      setEvents((prev) =>
        prev.map((event) =>
          getEventId(event) === eventId
            ? { ...event, dynamic_pricing_enable: res.data.enabled ? 1 : 0 }
            : event
        )
      );

      showAlert('success', `Dynamic pricing ${res.data.enabled ? 'enabled' : 'disabled'}`);
    } catch {
      showAlert('error', 'Failed to toggle dynamic pricing');
    }
  };

  const handleQrScan = async () => {
    if (!qrCode.trim()) return;

    try {
      const res = await api.post('/tickets/scan', {
        qr_code: qrCode.trim(),
      });

      setQrResult({
        success: true,
        data: res.data,
      });
    } catch (err) {
      setQrResult({
        success: false,
        message: err.response?.data?.message || 'Invalid or already used ticket',
      });
    }

    setQrCode('');
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

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const acceptedBookings = bookings.filter((b) => b.status === 'accepted');
  const pendingEvents = events.filter((e) => e.status === 'pending');
  const launchableEvents = events.filter((e) => e.status === 'approved' && !e.launch);
  const pendingComplaints = complaints.filter((c) => !c.status || c.status === 'pending');
  const pendingOrders = orders.filter((o) => !o.order_status || o.order_status === 'pending');

  const TABS = [
    {
      key: 'EVENTS',
      badge: launchableEvents.length > 0 ? `${launchableEvents.length} ready` : pendingEvents.length || null,
      badgeColor: 'var(--cyan)',
    },
    {
      key: 'BOOKINGS',
      badge: pendingBookings.length || (acceptedBookings.length ? `${acceptedBookings.length} accepted` : null),
      badgeColor: pendingBookings.length ? 'var(--gold)' : '#00c878',
    },
    {
      key: 'MARKETPLACE',
      badge: products.length || null,
      badgeColor: 'var(--cyan)',
    },
    {
      key: 'ORDERS',
      badge: pendingOrders.length || null,
      badgeColor: '#FF5252',
    },
    {
      key: 'COMPLAINTS',
      badge: pendingComplaints.length || null,
      badgeColor: '#FF5252',
    },
    {
      key: 'QR SCANNER',
      badge: null,
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {showBookModal && (
          <BookArtistModal
            singers={singers}
            onClose={() => setShowBookModal(false)}
            onSuccess={() => {
              refresh();
              showAlert('success', 'Booking request sent');
            }}
          />
        )}

        {createFromBooking && (
          <CreateEventFromBookingModal
            booking={createFromBooking}
            onClose={() => setCreateFromBooking(null)}
            onCreated={(data) => {
              refresh();

              showAlert(
                'success',
                data?.launchable
                  ? 'Event created. Click Launch to make it live.'
                  : 'Event created. Awaiting admin approval.'
              );

              setActiveTab('EVENTS');

              const eventId = data?.event_id || data?.id || data?.event?.event_id;

              if (eventId) {
                const addProduct = window.confirm(
                  'Do you want to add concert-dedicated products like T-shirt, cap or poster for this event?'
                );

                if (addProduct) {
                  navigate(`/marketplace/add?event_id=${eventId}`);
                }
              }
            }}
          />
        )}

        {complainQrModal && (
          <ComplaintQrModal
            event={complainQrModal}
            onClose={() => setComplaintQrModal(null)}
          />
        )}

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: 6,
            }}
          >
            Organizer Control Panel
          </div>

          <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'var(--text-display)',
                fontSize: 22,
                color: '#b040ff',
                letterSpacing: '0.08em',
                textShadow: '0 0 20px rgba(176,64,255,0.4)',
              }}
            >
              ORGANIZER DASHBOARD
            </h1>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/marketplace/add')}
              >
                + Add Marketplace Product
              </button>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBookModal(true)}
              >
                Book Artist
              </button>

              <button className="btn btn-ghost btn-sm" onClick={refresh}>
                ⟳ Refresh
              </button>
            </div>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: 16 }}>
            {alert.text}
          </div>
        )}

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 24 }}>
          <div className="stat-card cyan">
            <div>
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{events.length}</div>
            </div>
            <div className="stat-icon">🎵</div>
          </div>

          <div className="stat-card gold">
            <div>
              <div className="stat-label">Ready to Launch</div>
              <div className="stat-value">{launchableEvents.length}</div>
            </div>
            <div className="stat-icon">🚀</div>
          </div>

          <div className="stat-card green">
            <div>
              <div className="stat-label">Accepted Bookings</div>
              <div className="stat-value">{acceptedBookings.length}</div>
            </div>
            <div className="stat-icon">✅</div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Products</div>
              <div className="stat-value">{products.length}</div>
            </div>
            <div className="stat-icon">🛍️</div>
          </div>

          <div className="stat-card red">
            <div>
              <div className="stat-label">Pending Orders</div>
              <div className="stat-value">{pendingOrders.length}</div>
            </div>
            <div className="stat-icon">📦</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`panel-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.key}

                {tab.badge != null && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: tab.badgeColor,
                      color: '#000',
                      borderRadius: 20,
                      padding: '1px 6px',
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: 40 }}>
                <div className="spinner" />
              </div>
            ) : activeTab === 'EVENTS' ? (
              events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-title">NO EVENTS YET</div>
                  <div className="empty-sub">
                    Book an artist first. Once they accept, you can create and launch an event.
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => setShowBookModal(true)}
                  >
                    Book Artist
                  </button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Tickets Sold</th>
                        <th>Status</th>
                        <th>Dynamic Pricing</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {events.map((event) => {
                        const id = getEventId(event);
                        const dpEnabled =
                          event.dynamic_pricing_enable === 1 ||
                          event.dynamic_pricing_enable === true;

                        return (
                          <tr key={id}>
                            <td>
                              <strong>{event.title || 'Untitled Event'}</strong>
                              {event.singer_name && (
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                  🎤 {event.singer_name}
                                </div>
                              )}
                            </td>

                            <td
                              style={{
                                fontFamily: 'var(--text-mono)',
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {formatDate(event.date || event.event_date)}
                            </td>

                            <td>
                              <TicketSoldCell ev={event} />
                            </td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  color: STATUS_COLOR[event.status] || '#888',
                                  background: `${STATUS_COLOR[event.status] || '#888'}18`,
                                  border: `1px solid ${STATUS_COLOR[event.status] || '#888'}44`,
                                }}
                              >
                                {(event.status || '—').toUpperCase()}
                              </span>
                            </td>

                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => toggleDynamicPricing(id, dpEnabled)}
                              >
                                {dpEnabled ? 'ON' : 'OFF'}
                              </button>
                            </td>

                            <td>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {event.status === 'approved' && !event.launch && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleLaunch(event)}
                                  >
                                    Launch
                                  </button>
                                )}

                                {['live', 'ended'].includes(event.status) && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setComplaintQrModal(event)}
                                  >
                                    QR
                                  </button>
                                )}

                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => navigate(`/marketplace/add?event_id=${id}`)}
                                >
                                  Add Product
                                </button>

                                <Link to={`/concerts/${id}`} className="btn btn-primary btn-sm">
                                  View
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'BOOKINGS' ? (
              bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📨</div>
                  <div className="empty-title">NO BOOKING REQUESTS</div>
                  <div className="empty-sub">Send a booking request to an artist to get started.</div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 16 }}
                    onClick={() => setShowBookModal(true)}
                  >
                    Book Artist
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.map((b) => (
                    <div
                      key={b.booking_id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: 'var(--border-dim)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 16,
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <strong>🎤 {b.singer_name || 'Unknown Singer'}</strong>

                        <span
                          className={`badge ${
                            b.status === 'accepted'
                              ? 'badge-green'
                              : b.status === 'rejected'
                              ? 'badge-red'
                              : 'badge-gold'
                          }`}
                        >
                          {(b.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        📅 {formatDate(b.event_date)} · 📍 {b.venue || '—'} · ৳
                        {Number(b.proposed_fee || 0).toLocaleString()}
                      </div>

                      {b.status === 'accepted' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: 10 }}
                          onClick={() => setCreateFromBooking(b)}
                        >
                          Create Event
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'MARKETPLACE' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/marketplace/add')}
                  >
                    + Add General Product
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🛍️</div>
                    <div className="empty-title">NO PRODUCTS ADDED</div>
                    <div className="empty-sub">
                      Add music instruments, disks, guitar accessories, T-shirts, caps or concert products.
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                      gap: 14,
                    }}
                  >
                    {products.map((p) => (
                      <ProductCard key={p.product_id} product={p} />
                    ))}
                  </div>
                )}
              </>
            ) : activeTab === 'ORDERS' ? (
              <OrdersPanel orders={orders} onStatus={handleOrderStatus} />
            ) : activeTab === 'COMPLAINTS' ? (
              complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">NO COMPLAINTS YET</div>
                  <div className="empty-sub">
                    Complaints submitted for your events will appear here.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {complaints.map((c) => {
                    const cid = c.complaint_id || c.id;
                    const st = COMPLAINT_STATUS_COLOR[c.status] || COMPLAINT_STATUS_COLOR.pending;
                    const media = Array.isArray(c.media) ? c.media : [];

                    return (
                      <div
                        key={cid}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: `1px solid ${st.border}`,
                          borderLeft: `3px solid ${st.color}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: 16,
                        }}
                      >
                        <div className="flex-between" style={{ marginBottom: 10 }}>
                          <div>
                            <strong style={{ color: 'var(--gold)' }}>
                              📍 {c.event_title || '—'}
                            </strong>

                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                              {c.reporter_name || 'Anonymous'} · {formatDate(c.created_at)}
                            </div>
                          </div>

                          <span
                            style={{
                              background: st.bg,
                              border: `1px solid ${st.border}`,
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontFamily: 'var(--text-mono)',
                              fontSize: 10,
                              color: st.color,
                            }}
                          >
                            {(c.status || 'PENDING').toUpperCase()}
                          </span>
                        </div>

                        {c.text_content && (
                          <div
                            style={{
                              fontSize: 13,
                              color: 'var(--text-secondary)',
                              lineHeight: 1.7,
                              marginBottom: 10,
                              padding: '10px 14px',
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: 8,
                            }}
                          >
                            {c.text_content}
                          </div>
                        )}

                        {media.length > 0 && <MediaViewer media={media} />}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div>
                <div className="stat-label" style={{ marginBottom: 12 }}>
                  Enter QR Code or Ticket ID
                </div>

                <div style={{ display: 'flex', gap: 10, maxWidth: 480, marginBottom: 24 }}>
                  <input
                    className="form-control"
                    placeholder="Paste QR code value here"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQrScan()}
                  />

                  <button className="btn btn-primary" onClick={handleQrScan}>
                    SCAN
                  </button>
                </div>

                {qrResult && (
                  <div className={`alert alert-${qrResult.success ? 'success' : 'error'}`}>
                    {qrResult.success
                      ? `VALID — ${qrResult.data?.event_title || 'Event'} | Buyer: ${
                          qrResult.data?.buyer || '—'
                        }`
                      : `INVALID — ${qrResult.message}`}
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
