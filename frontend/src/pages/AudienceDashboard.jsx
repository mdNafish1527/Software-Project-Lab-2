import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_STYLE = {
  pending: { badge: 'badge-red', label: 'PENDING' },
  reviewed: { badge: 'badge-gold', label: 'REVIEWED' },
  resolved: { badge: 'badge-green', label: 'RESOLVED' },
  dismissed: { badge: 'badge-gold', label: 'DISMISSED' },
};

const TIER_NAMES = {
  1: 'Standing',
  2: 'Chair',
  3: 'Sofa',
};

function formatDate(d) {
  if (!d) return '—';

  try {
    return new Date(d).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateTime(d) {
  if (!d) return '—';

  try {
    return new Date(d).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getTierLabel(ticket) {
  return (
    ticket.tier_name ||
    TIER_NAMES[ticket.tier] ||
    TIER_NAMES[ticket.tier_number] ||
    `Tier ${ticket.tier || '—'}`
  );
}

function detectMediaType(media) {
  const src = String(media?.url || media?.file_url || media?.path || '').toLowerCase();
  const mime = String(media?.media_type || media?.type || '').toLowerCase();

  if (mime.startsWith('image') || /\.(jpg|jpeg|png|gif|webp)$/.test(src)) return 'image';
  if (mime.startsWith('audio') || /\.(mp3|wav|ogg|m4a|webm)$/.test(src)) return 'audio';
  if (mime.startsWith('video') || /\.(mp4|webm|mov|ogg)$/.test(src)) return 'video';

  return 'file';
}

function MediaItem({ media }) {
  const type = detectMediaType(media);
  const src = media?.url || media?.file_url || media?.path || '';
  const name = media?.original_name || media?.filename || media?.name || 'Attachment';

  if (!src) return null;

  if (type === 'image') {
    return (
      <div
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '260px',
        }}
      >
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            display: 'block',
            maxHeight: '180px',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
          onClick={() => window.open(src, '_blank')}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />

        <div
          style={{
            padding: '5px 8px',
            background: 'rgba(0,0,0,0.4)',
            fontFamily: 'var(--text-mono)',
            fontSize: '10px',
            color: 'var(--text-dim)',
          }}
        >
          🖼️ {name}
        </div>
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div
        style={{
          background: 'rgba(212,168,83,0.05)',
          border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: '8px',
          padding: '10px 12px',
          minWidth: '220px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--text-mono)',
            fontSize: '10px',
            color: 'var(--gold)',
            marginBottom: '6px',
          }}
        >
          🎵 {name}
        </div>

        <audio controls src={src} style={{ width: '100%', height: '32px' }} />
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div
        style={{
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          maxWidth: '280px',
        }}
      >
        <video
          controls
          src={src}
          style={{
            width: '100%',
            maxHeight: '180px',
            display: 'block',
            background: '#000',
          }}
        />

        <div
          style={{
            padding: '5px 8px',
            background: 'rgba(0,0,0,0.4)',
            fontFamily: 'var(--text-mono)',
            fontSize: '10px',
            color: 'var(--text-dim)',
          }}
        >
          📹 {name}
        </div>
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(0,212,255,0.05)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontFamily: 'var(--text-mono)',
        fontSize: '12px',
        color: 'var(--cyan)',
        textDecoration: 'none',
      }}
    >
      📎 {name}
    </a>
  );
}

function ComplaintCard({ complaint }) {
  const [expanded, setExpanded] = useState(false);

  const body = complaint.description || complaint.text_content || '';
  const mediaList = Array.isArray(complaint.media)
    ? complaint.media
    : Array.isArray(complaint.attachments)
    ? complaint.attachments
    : [];

  const statusKey = complaint.status || 'pending';
  const { badge, label } = STATUS_STYLE[statusKey] || STATUS_STYLE.pending;

  const borderAccent =
    statusKey === 'resolved'
      ? 'var(--cyan)'
      : statusKey === 'dismissed'
      ? 'var(--gold)'
      : '#FF5252';

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${borderAccent}33`,
        borderLeft: `3px solid ${borderAccent}`,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
        onClick={() => setExpanded((value) => !value)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <span className={`badge ${badge}`}>{label}</span>

            {mediaList.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--text-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                }}
              >
                📎 {mediaList.length} attachment{mediaList.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {complaint.event_title && (
            <div
              style={{
                fontFamily: 'var(--text-display)',
                fontSize: '13px',
                color: 'var(--gold)',
                marginBottom: '3px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              🎵 {complaint.event_title}
            </div>
          )}

          <div
            style={{
              fontFamily: 'var(--text-body)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}
          >
            {body || 'No complaint text'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '6px',
              fontFamily: 'var(--text-mono)',
              fontSize: '10px',
              color: 'var(--text-dim)',
            }}
          >
            <span>🕐 {formatDateTime(complaint.created_at)}</span>
          </div>
        </div>

        <div style={{ color: 'var(--text-dim)', fontSize: '14px', flexShrink: 0 }}>
          {expanded ? '▴' : '▾'}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            padding: '0 16px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {body && (
            <div
              style={{
                fontFamily: 'var(--text-body)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                marginTop: '14px',
                marginBottom: mediaList.length ? '16px' : '0',
              }}
            >
              {body}
            </div>
          )}

          {mediaList.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--text-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  marginTop: '14px',
                }}
              >
                Attachments
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {mediaList.map((m, index) => (
                  <MediaItem key={index} media={m} />
                ))}
              </div>
            </div>
          )}

          {complaint.admin_note && (
            <div
              style={{
                marginTop: '14px',
                background: 'rgba(0,212,255,0.05)',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--text-mono)',
                  fontSize: '10px',
                  color: 'var(--cyan)',
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}
              >
                ADMIN NOTE
              </div>

              <div
                style={{
                  fontFamily: 'var(--text-body)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {complaint.admin_note}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QRCode({ value, size = 100 }) {
  if (!value) {
    return <div style={{ fontSize: '32px', opacity: 0.3 }}>📱</div>;
  }

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    value
  )}&bgcolor=0d0d0d&color=00d4ff&format=png`;

  return (
    <img
      src={url}
      alt="QR"
      width={size}
      height={size}
      style={{
        borderRadius: '6px',
        border: '1px solid rgba(0,212,255,0.25)',
      }}
    />
  );
}

function TicketCard({ ticket }) {
  const [expanded, setExpanded] = useState(false);

  const isUsed = Boolean(ticket.used || ticket.scanned);
  const qrValue = ticket.qr_code || ticket.ticket_code || `TKT-${ticket.ticket_id || ticket.id}`;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: isUsed
          ? '1px solid rgba(212,168,83,0.35)'
          : '1px solid rgba(0,212,255,0.25)',
        borderLeft: isUsed ? '3px solid var(--gold)' : '3px solid var(--cyan)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ flex: 1, padding: '16px 18px' }}>
          <div
            style={{
              fontFamily: 'var(--text-display)',
              fontSize: '15px',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            {ticket.event_title || ticket.title || 'Concert Ticket'}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            {[
              ['📅', formatDate(ticket.event_date || ticket.date || ticket.concert_date)],
              ['📍', ticket.venue || ticket.event_venue || '—'],
              ['🎟️', getTierLabel(ticket)],
              ['💰', ticket.price ? `৳${Number(ticket.price).toLocaleString()}` : '—'],
            ].map(([icon, value]) => (
              <span
                key={icon}
                style={{
                  fontFamily: 'var(--text-mono)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <span>{icon}</span>
                <span>{value}</span>
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span className={`badge ${isUsed ? 'badge-gold' : 'badge-green'}`}>
              {isUsed ? '✓ USED / SCANNED' : '● VALID'}
            </span>

            <span
              style={{
                fontFamily: 'var(--text-mono)',
                fontSize: '10px',
                color: 'var(--text-dim)',
                wordBreak: 'break-all',
              }}
            >
              {qrValue}
            </span>

            {isUsed && (
              <Link
                to={`/concerts/${ticket.event_id}`}
                className="btn btn-danger btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                Submit Complaint
              </Link>
            )}

            {!isUsed && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--text-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                }}
              >
                Complaint after QR scan
              </span>
            )}

            <button
              onClick={() => setExpanded((value) => !value)}
              style={{
                background: 'none',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: '6px',
                color: 'var(--cyan)',
                cursor: 'pointer',
                padding: '4px 10px',
                fontFamily: 'var(--text-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              {expanded ? 'HIDE QR ▲' : 'SHOW QR ▼'}
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderLeft: '1px dashed rgba(255,255,255,0.08)',
            minWidth: '80px',
          }}
        >
          <QRCode value={qrValue} size={64} />
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px dashed rgba(255,255,255,0.08)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            background: 'var(--bg-secondary)',
          }}
        >
          <QRCode value={qrValue} size={200} />

          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              textAlign: 'center',
              lineHeight: '1.8',
            }}
          >
            <div
              style={{
                color: 'var(--cyan)',
                fontWeight: '700',
                marginBottom: '4px',
              }}
            >
              {qrValue}
            </div>

            <div style={{ fontSize: '10px', opacity: 0.6 }}>
              Present this QR code at the venue entrance
            </div>

            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '2px' }}>
              {ticket.event_title} · {formatDate(ticket.event_date)} · {getTierLabel(ticket)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductOrderRow({ order }) {
  const status = order.order_status || order.status || 'pending';

  return (
    <tr>
      <td style={{ fontFamily: 'var(--text-body)', fontSize: '13px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {order.product_image && (
            <img
              src={order.product_image}
              alt={order.product_name}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                objectFit: 'cover',
              }}
            />
          )}

          <div>
            <div>{order.product_name || order.item_name || order.name || 'Product'}</div>

            <div
              style={{
                fontFamily: 'var(--text-mono)',
                fontSize: '10px',
                color: 'var(--text-dim)',
              }}
            >
              Seller: {order.seller_name || '—'}
            </div>
          </div>
        </div>
      </td>

      <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px' }}>
        {order.quantity || 1}
      </td>

      <td
        style={{
          color: 'var(--gold)',
          fontFamily: 'var(--text-display)',
          fontSize: '14px',
        }}
      >
        ৳{Number(order.total_price || order.price || 0).toLocaleString()}
      </td>

      <td
        style={{
          fontFamily: 'var(--text-mono)',
          fontSize: '10px',
          color: 'var(--text-dim)',
        }}
      >
        {order.transaction_id || '—'}
      </td>

      <td>
        <span
          className={`badge ${
            status === 'delivered'
              ? 'badge-green'
              : status === 'rejected' || status === 'cancelled'
              ? 'badge-red'
              : 'badge-cyan'
          }`}
        >
          {String(status).toUpperCase()}
        </span>
      </td>
    </tr>
  );
}

export default function AudienceDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [ticketsRes, ordersRes, complaintsRes] = await Promise.all([
          api.get('/tickets/mine').catch(() => ({ data: {} })),
          api
            .get('/market/orders/my')
            .catch(() => api.get('/marketplace/orders/my').catch(() => ({ data: [] }))),
          api.get('/complaints/mine').catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const purchases = ticketsRes.data?.purchases || [];

        const ticketData = purchases.flatMap((group) =>
          (group.tickets || []).map((ticket) => ({
            ...ticket,
            event_id: group.event_id,
            event_title: group.event_title,
            event_date: group.event_date,
            event_time: group.event_time,
            venue: group.venue,
            city: group.city,
            banner_image: group.banner_image,
            singer_name: group.singer_name,
          }))
        );

        setTickets(ticketData);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.orders || []);
        setComplaints(
          Array.isArray(complaintsRes.data)
            ? complaintsRes.data
            : complaintsRes.data?.complaints || []
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const displayName =
    user?.unique_username || user?.username || user?.name || user?.email || 'User';

  const avatarChar = displayName.charAt(0).toUpperCase();

  const usedTickets = tickets.filter((ticket) => ticket.used || ticket.scanned);

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '6px',
            }}
          >
            Audience Control Panel
          </div>

          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1
                style={{
                  fontFamily: 'var(--text-display)',
                  fontSize: '22px',
                  color: 'var(--cyan)',
                  letterSpacing: '0.08em',
                  textShadow: 'var(--cyan-glow)',
                }}
              >
                MY DASHBOARD
              </h1>

              <button
                onClick={refresh}
                style={{
                  background: 'rgba(0,212,255,0.08)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  borderRadius: '8px',
                  color: 'var(--cyan)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '16px',
                }}
              >
                ⟳
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="avatar avatar-md"
                style={{
                  background: 'var(--cyan-dim)',
                  border: '2px solid rgba(0,212,255,0.4)',
                  color: 'var(--cyan)',
                  fontSize: '16px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatarChar}
              </div>

              <div>
                <div
                  style={{
                    fontFamily: 'var(--text-display)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                  }}
                >
                  {displayName}
                </div>

                <div
                  style={{
                    fontFamily: 'var(--text-mono)',
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                  }}
                >
                  AUDIENCE
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}
        >
          <div className="stat-card cyan">
            <div>
              <div className="stat-label">My Tickets</div>
              <div className="stat-value">{tickets.length}</div>
            </div>
            <div className="stat-icon">🎫</div>
          </div>

          <div className="stat-card gold">
            <div>
              <div className="stat-label">Scanned Tickets</div>
              <div className="stat-value">{usedTickets.length}</div>
            </div>
            <div className="stat-icon">✅</div>
          </div>

          <div className="stat-card green">
            <div>
              <div className="stat-label">Product Orders</div>
              <div className="stat-value">{orders.length}</div>
            </div>
            <div className="stat-icon">🛒</div>
          </div>

          <div className="stat-card red">
            <div>
              <div className="stat-label">Complaints</div>
              <div className="stat-value">{complaints.length}</div>
            </div>
            <div className="stat-icon">📋</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link to="/concerts" className="btn btn-primary">
            🎵 Browse Concerts
          </Link>

          <Link to="/marketplace" className="btn btn-gold">
            🛒 Marketplace
          </Link>

          <Link to="/singers" className="btn btn-ghost">
            🎤 Artists
          </Link>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {[
              ['tickets', tickets.length],
              ['orders', orders.length],
              ['complaints', complaints.length],
            ].map(([tab, count]) => (
              <button
                key={tab}
                className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {String(tab).toUpperCase()}

                {count > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      background:
                        tab === 'tickets'
                          ? 'var(--cyan)'
                          : tab === 'orders'
                          ? 'var(--gold)'
                          : '#FF5252',
                      color: '#000',
                      borderRadius: '30px',
                      padding: '1px 6px',
                      fontSize: '9px',
                      fontWeight: '700',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}>
                <div className="spinner" />
              </div>
            ) : activeTab === 'tickets' ? (
              tickets.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎫</div>
                  <div className="empty-title">NO TICKETS YET</div>
                  <div className="empty-sub">Browse concerts and buy your first ticket</div>

                  <Link to="/concerts" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    🎵 Browse Concerts
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.ticket_id || ticket.id} ticket={ticket} />
                  ))}
                </div>
              )
            ) : activeTab === 'orders' ? (
              orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-title">NO PRODUCT ORDERS YET</div>
                  <div className="empty-sub">Visit the marketplace to buy merchandise</div>

                  <Link
                    to="/marketplace"
                    className="btn btn-gold"
                    style={{ marginTop: '16px' }}
                  >
                    🛍 Go to Marketplace
                  </Link>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Transaction</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orders.map((order) => (
                        <ProductOrderRow key={order.id || order.order_id} order={order} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">NO COMPLAINTS</div>
                <div className="empty-sub">
                  Complaints can be submitted after your ticket QR is scanned at the event
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.complaint_id || complaint.id}
                    complaint={complaint}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
