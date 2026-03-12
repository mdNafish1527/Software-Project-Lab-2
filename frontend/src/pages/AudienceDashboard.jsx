import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TIER_NAMES = { 1: 'General', 2: 'VIP', 3: 'Student' };
const tierLabel = (ticket) =>
  ticket.tier_name || TIER_NAMES[ticket.tier] || TIER_NAMES[ticket.tier_number] || `Tier ${ticket.tier || '—'}`;

const ticketDate = (ticket) => {
  const raw = ticket.date || ticket.event_date || ticket.concert_date;
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

function QRCode({ value, size = 100 }) {
  if (!value) return <div style={{ fontSize: '32px', opacity: 0.3 }}>📱</div>;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=0d0d0d&color=00d4ff&format=png`;
  return <img src={url} alt="QR" width={size} height={size} style={{ borderRadius: '6px', border: '1px solid rgba(0,212,255,0.25)' }} />;
}

function TicketCard({ ticket }) {
  const [expanded, setExpanded] = useState(false);
  const qty = ticket.quantity || ticket.qty || 1;
  const isUsed = ticket.used || ticket.scanned;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: isUsed ? '1px solid rgba(212,168,83,0.35)' : '1px solid rgba(0,212,255,0.25)',
      borderLeft: isUsed ? '3px solid var(--gold)' : '3px solid var(--cyan)',
      borderRadius: 'var(--radius-sm)', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ flex: 1, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'var(--text-display)', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {ticket.event_title || ticket.title || 'Concert Ticket'}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              ['📅', ticketDate(ticket)],
              ['📍', ticket.venue || ticket.event_venue || '—'],
              ['🎟', tierLabel(ticket)],
              ['✕', `${qty} ticket${qty > 1 ? 's' : ''}`],
              ['💰', ticket.price ? `৳${Number(ticket.price).toLocaleString()}` : '—'],
            ].map(([icon, val]) => (
              <span key={icon} style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '5px' }}>
                <span>{icon}</span><span>{val}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
            <span className={`badge ${isUsed ? 'badge-gold' : 'badge-green'}`}>
              {isUsed ? '✓ USED' : '● VALID'}
            </span>
            {ticket.transaction_id && (
              <span style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                TX: {ticket.transaction_id}
              </span>
            )}
            <button onClick={() => setExpanded(e => !e)} style={{
              marginLeft: 'auto', background: 'none',
              border: '1px solid rgba(0,212,255,0.25)', borderRadius: '6px',
              color: 'var(--cyan)', cursor: 'pointer', padding: '4px 10px',
              fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.1em',
            }}>
              {expanded ? 'HIDE QR ▲' : 'SHOW QR ▼'}
            </button>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px dashed rgba(255,255,255,0.08)', minWidth: '80px' }}>
          <QRCode value={ticket.ticket_code || ticket.qr_code || `TKT-${ticket.ticket_id || ticket.id}`} size={64} />
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)' }}>
          <QRCode value={ticket.ticket_code || ticket.qr_code || `TKT-${ticket.ticket_id || ticket.id}`} size={180} />
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
            {ticket.ticket_code || `TKT-${ticket.ticket_id || ticket.id}`}<br />
            <span style={{ fontSize: '10px', opacity: 0.6 }}>Present this QR at the venue entrance</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AudienceDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets]       = useState([]);
  const [orders, setOrders]         = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('tickets');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/tickets/mine').catch(err => {
        console.error('tickets/mine failed:', err.response?.status, err.response?.data || err.message);
        return { data: [] };
      }),
      api.get('/marketplace/orders/mine').catch(err => {
        console.error('orders/mine failed:', err.response?.status, err.response?.data || err.message);
        return { data: [] };
      }),
      api.get('/complaints/mine').catch(err => {
        console.error('complaints/mine failed:', err.response?.status, err.response?.data || err.message);
        return { data: [] };
      }),
    ]).then(([t, o, c]) => {
      const ticketData = Array.isArray(t.data) ? t.data : (t.data?.tickets || []);
      const orderData  = Array.isArray(o.data) ? o.data : (o.data?.orders || []);
      const compData   = Array.isArray(c.data) ? c.data : (c.data?.complaints || []);
      console.log('[Dashboard] Loaded — tickets:', ticketData.length, '| orders:', orderData.length, '| complaints:', compData.length);
      setTickets(ticketData);
      setOrders(orderData);
      setComplaints(compData);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const displayName = user?.unique_username || user?.username || user?.name || user?.email || 'User';
  const avatarChar  = displayName.charAt(0).toUpperCase();

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
            Audience Control Panel
          </div>
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--cyan)', letterSpacing: '0.08em', textShadow: 'var(--cyan-glow)' }}>
                MY DASHBOARD
              </h1>
              <button onClick={refresh} title="Refresh data" style={{
                background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: '8px', color: 'var(--cyan)', cursor: 'pointer',
                padding: '6px 12px', fontSize: '16px',
              }}>⟳</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-md" style={{ background: 'var(--cyan-dim)', border: '2px solid rgba(0,212,255,0.4)', color: 'var(--cyan)', fontSize: '16px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarChar}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>{displayName}</div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>AUDIENCE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">My Tickets</div><div className="stat-value">{tickets.length}</div></div>
            <div className="stat-icon">🎫</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Orders</div><div className="stat-value">{orders.length}</div></div>
            <div className="stat-icon">🛒</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Complaints</div><div className="stat-value">{complaints.length}</div></div>
            <div className="stat-icon">📋</div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link to="/concerts" className="btn btn-primary">🎵 Browse Concerts</Link>
          <Link to="/marketplace" className="btn btn-gold">🛒 Marketplace</Link>
          <Link to="/singers" className="btn btn-ghost">🎤 Artists</Link>
        </div>

        {/* Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {['tickets', 'orders', 'complaints'].map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.toUpperCase()}
                {tab === 'tickets' && tickets.length > 0 && (
                  <span style={{ marginLeft:'6px', background:'var(--cyan)', color:'#000', borderRadius:'30px', padding:'1px 6px', fontSize:'9px', fontWeight:'700' }}>
                    {tickets.length}
                  </span>
                )}
                {tab === 'orders' && orders.length > 0 && (
                  <span style={{ marginLeft:'6px', background:'var(--gold)', color:'#000', borderRadius:'30px', padding:'1px 6px', fontSize:'9px', fontWeight:'700' }}>
                    {orders.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>

            ) : activeTab === 'tickets' ? (
              tickets.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎫</div>
                  <div className="empty-title">NO TICKETS YET</div>
                  <div className="empty-sub">Browse concerts and buy your first ticket</div>
                  <Link to="/concerts" className="btn btn-primary" style={{ marginTop: '16px' }}>🎵 Browse Concerts</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.ticket_id || ticket.id} ticket={ticket} />
                  ))}
                </div>
              )

            ) : activeTab === 'orders' ? (
              orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-title">NO ORDERS YET</div>
                  <div className="empty-sub">Visit the marketplace to buy merchandise</div>
                  <Link to="/marketplace" className="btn btn-gold" style={{ marginTop: '16px' }}>🛍 Go to Marketplace</Link>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Item</th><th>Qty</th><th>Total</th><th>Transaction</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id || order.order_id}>
                          <td style={{ fontFamily: 'var(--text-body)', fontSize: '13px' }}>{order.item_name || order.name || '—'}</td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px' }}>{order.quantity || 1}</td>
                          <td style={{ color: 'var(--gold)', fontFamily: 'var(--text-display)', fontSize: '14px' }}>
                            ৳{Number(order.total_price || order.price || 0).toLocaleString()}
                          </td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>{order.transaction_id || '—'}</td>
                          <td>
                            <span className={`badge ${order.status === 'delivered' ? 'badge-green' : order.status === 'cancelled' ? 'badge-red' : 'badge-cyan'}`}>
                              {(order.status || 'PENDING').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )

            ) : (
              complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">NO COMPLAINTS</div>
                  <div className="empty-sub">You haven't submitted any complaints</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {complaints.map(c => (
                    <div key={c.id} style={{ background: 'var(--bg-secondary)', border: 'var(--border-dim)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                      <div className="flex-between" style={{ marginBottom: '6px' }}>
                        <div style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: 'var(--text-primary)' }}>{c.subject}</div>
                        <span className={`badge ${c.status === 'resolved' ? 'badge-green' : 'badge-gold'}`}>{(c.status || 'PENDING').toUpperCase()}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--text-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.description}</div>
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
