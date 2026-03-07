import { useState, useEffect } from 'react';
import api from '../api';

const TABS = ['PENDING', 'USERS', 'COMPLAINTS', 'EVENTS'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users/pending').catch(() => ({ data: [] })),
      api.get('/users/all').catch(() => ({ data: [] })),
      api.get('/complaints').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
    ]).then(([p, u, c, e]) => {
      setPending(p.data || []);
      setUsers(u.data || []);
      setComplaints(c.data || []);
      setEvents(e.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/users/${id}/approve`);
      setPending(p => p.filter(u => u.id !== id));
      showAlert('success', 'User approved successfully');
    } catch { showAlert('error', 'Failed to approve user'); }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/users/${id}/reject`);
      setPending(p => p.filter(u => u.id !== id));
      showAlert('success', 'User rejected');
    } catch { showAlert('error', 'Failed to reject user'); }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await api.post('/auth/invite-admin', { email: inviteEmail });
      setInviteEmail('');
      showAlert('success', `Invite sent to ${inviteEmail}`);
    } catch { showAlert('error', 'Failed to send invite'); }
  };

  const roleColor = (role) => {
    if (role === 'admin')     return 'badge-red';
    if (role === 'singer')    return 'badge-gold';
    if (role === 'organizer') return 'badge-purple';
    return 'badge-cyan';
  };

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            System Administration
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--red)',
              letterSpacing: '0.08em', textShadow: 'var(--red-glow)'
            }}>
              ADMIN DASHBOARD
            </h1>
            <span className="badge badge-red">
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', animation: 'pulse 2s infinite' }} />
              &nbsp;ADMIN ACCESS
            </span>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div></div>
            <div className="stat-icon">👥</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Pending Approval</div><div className="stat-value">{pending.length}</div></div>
            <div className="stat-icon">⏳</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Live Events</div><div className="stat-value">{events.length}</div></div>
            <div className="stat-icon">🎵</div>
          </div>
          <div className="stat-card red">
            <div><div className="stat-label">Complaints</div><div className="stat-value">{complaints.length}</div></div>
            <div className="stat-icon">📋</div>
          </div>
        </div>

        {/* Invite Admin */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid rgba(255,68,102,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          display: 'flex', gap: '12px', alignItems: 'center',
          marginBottom: '24px', flexWrap: 'wrap'
        }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--red)', flexShrink: 0 }}>
            INVITE ADMIN
          </div>
          <input
            className="form-control"
            placeholder="admin@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button className="btn btn-danger btn-sm" onClick={handleInvite}>SEND INVITE</button>
        </div>

        {/* Main Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab}
                {tab === 'PENDING' && pending.length > 0 && (
                  <span style={{
                    marginLeft: '6px', background: 'var(--red)', color: '#fff',
                    borderRadius: '30px', padding: '1px 6px', fontSize: '9px'
                  }}>{pending.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}>
                <div className="spinner" />
              </div>
            ) : activeTab === 'PENDING' ? (
              pending.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✓</div>
                  <div className="empty-title">ALL CLEAR</div>
                  <div className="empty-sub">No pending approvals</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pending.map(u => (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', background: 'var(--bg-secondary)',
                      border: 'var(--border-dim)', borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap'
                    }}>
                      <div className="avatar avatar-sm" style={{
                        background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)',
                        color: 'var(--cyan)'
                      }}>
                        {u.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--text-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {u.name}
                        </div>
                        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                          {u.email}
                        </div>
                      </div>
                      <span className={`badge ${roleColor(u.role)}`}>{u.role?.toUpperCase()}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(u.id)}>✓ APPROVE</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(u.id)}>✗ REJECT</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : activeTab === 'USERS' ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar avatar-sm" style={{
                            background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)',
                            color: 'var(--cyan)', fontSize: '11px'
                          }}>{u.name?.charAt(0)}</div>
                          {u.name}
                        </td>
                        <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td><span className={`badge ${roleColor(u.role)}`}>{u.role?.toUpperCase()}</span></td>
                        <td>
                          <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-gold'}`}>
                            {(u.status || 'ACTIVE').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'COMPLAINTS' ? (
              complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">NO COMPLAINTS</div>
                  <div className="empty-sub">No complaints have been submitted</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {complaints.map(c => (
                    <div key={c.id} style={{
                      background: 'var(--bg-secondary)', border: 'var(--border-dim)',
                      borderLeft: '3px solid var(--red)',
                      borderRadius: 'var(--radius-sm)', padding: '14px 16px'
                    }}>
                      <div className="flex-between" style={{ marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: 'var(--text-primary)' }}>
                          {c.subject}
                        </div>
                        <span className="badge badge-red">{(c.status || 'open').toUpperCase()}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--text-body)', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {c.description}
                      </div>
                      <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                        By: {c.user_name || c.user_email} · Event: {c.event_title || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* EVENTS tab */
              events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-title">NO EVENTS</div>
                  <div className="empty-sub">No events have been created yet</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Venue</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <tr key={ev.id}>
                          <td>{ev.title}</td>
                          <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--text-mono)', fontSize: '12px' }}>
                            {ev.venue || '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}
                          </td>
                          <td><span className="badge badge-green">LIVE</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
