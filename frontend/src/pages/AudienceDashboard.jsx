import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

export default function AudienceDashboard() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    Promise.all([
      api.get('/tickets/mine').catch(() => ({ data: [] })),
      api.get('/marketplace/orders/mine').catch(() => ({ data: [] })),
      api.get('/complaints/mine').catch(() => ({ data: [] })),
    ]).then(([t, o, c]) => {
      setTickets(t.data || []);
      setOrders(o.data || []);
      setComplaints(c.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Audience Control Panel
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--cyan)',
              letterSpacing: '0.08em', textShadow: 'var(--cyan-glow)'
            }}>
              MY DASHBOARD
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-md" style={{
                background: 'var(--cyan-dim)', border: '2px solid rgba(0,212,255,0.4)',
                color: 'var(--cyan)', fontSize: '16px', width: '40px', height: '40px'
              }}>
                {user?.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
                  AUDIENCE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div>
              <div className="stat-label">My Tickets</div>
              <div className="stat-value">{tickets.length}</div>
            </div>
            <div className="stat-icon">🎫</div>
          </div>
          <div className="stat-card gold">
            <div>
              <div className="stat-label">Orders</div>
              <div className="stat-value">{orders.length}</div>
            </div>
            <div className="stat-icon">🛒</div>
          </div>
          <div className="stat-card green">
            <div>
              <div className="stat-label">Complaints</div>
              <div className="stat-value">{complaints.length}</div>
            </div>
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
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab.toUpperCase()}
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
                  <div className="empty-sub">Browse concerts to buy tickets</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="ticket">
                      <div className="ticket-left">
                        <div className="ticket-event-name">{ticket.event_title || 'Concert'}</div>
                        <div className="ticket-meta">
                          <span>📅 {ticket.event_date ? new Date(ticket.event_date).toLocaleDateString() : '—'}</span>
                          <span>📍 {ticket.venue || '—'}</span>
                          <span>🎟 Tier: {ticket.tier_name || '—'}</span>
                          <span>Qty: {ticket.quantity}</span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <span className={`badge ${ticket.scanned ? 'badge-gold' : 'badge-green'}`}>
                            {ticket.scanned ? 'USED' : 'VALID'}
                          </span>
                        </div>
                      </div>
                      <div className="ticket-right" style={{
                        background: 'var(--bg-secondary)',
                        fontSize: '32px', opacity: 0.5
                      }}>
                        📱
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'orders' ? (
              orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <div className="empty-title">NO ORDERS YET</div>
                  <div className="empty-sub">Visit the marketplace to buy merchandise</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.item_name}</td>
                          <td>{order.quantity}</td>
                          <td style={{ color: 'var(--gold)' }}>৳{order.total_price?.toLocaleString()}</td>
                          <td><span className="badge badge-cyan">{order.status || 'PLACED'}</span></td>
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
                    <div key={c.id} style={{
                      background: 'var(--bg-secondary)', border: 'var(--border-dim)',
                      borderRadius: 'var(--radius-sm)', padding: '14px'
                    }}>
                      <div style={{
                        fontFamily: 'var(--text-display)', fontSize: '13px',
                        color: 'var(--text-primary)', marginBottom: '6px'
                      }}>
                        {c.subject}
                      </div>
                      <div style={{ fontFamily: 'var(--text-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {c.description}
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <span className="badge badge-gold">{c.status || 'PENDING'}</span>
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
