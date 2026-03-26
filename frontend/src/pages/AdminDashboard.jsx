import { useState, useEffect } from 'react';
import api from '../api';

const TABS = ['PENDING', 'USERS', 'EVENTS', 'COMPLAINTS'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

const roleColor = (role) => {
  if (role === 'admin')     return 'badge-red';
  if (role === 'singer')    return 'badge-gold';
  if (role === 'organizer') return 'badge-cyan';
  return 'badge-green';
};

const statusColor = {
  approved:  '#00BFA6',
  live:      '#ff4444',
  ended:     '#888',
  cancelled: '#FF5252',
  pending:   '#D4A853',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab]   = useState('PENDING');
  const [pending, setPending]       = useState([]);
  const [users, setUsers]           = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [alert, setAlert]           = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/users/pending').catch(() => ({ data: [] })),
      api.get('/users/all').catch(() => ({ data: [] })),
      api.get('/complaints').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: { events: [] } })),
    ]).then(([p, u, c, e]) => {
      // /users/pending → array directly
      setPending(Array.isArray(p.data) ? p.data : []);
      // /users/all → array directly
      setUsers(Array.isArray(u.data) ? u.data : []);
      // /complaints → array directly
      setComplaints(Array.isArray(c.data) ? c.data : []);
      // /events → { events: [...], pagination: {...} }
      setEvents(Array.isArray(e.data) ? e.data : (e.data?.events || []));
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleApprove = async (u_id) => {
    try {
      await api.post(`/users/${u_id}/approve`);
      setPending(p => p.filter(u => u.u_id !== u_id));
      setUsers(prev => prev.map(u => u.u_id === u_id ? { ...u, status: 'active' } : u));
      showAlert('success', '✅ User approved and notified');
    } catch { showAlert('error', 'Failed to approve user'); }
  };

  const handleReject = async (u_id) => {
    try {
      await api.post(`/users/${u_id}/reject`);
      setPending(p => p.filter(u => u.u_id !== u_id));
      setUsers(prev => prev.map(u => u.u_id === u_id ? { ...u, status: 'rejected' } : u));
      showAlert('success', 'User rejected');
    } catch { showAlert('error', 'Failed to reject user'); }
  };

  const handleComplaintStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      setComplaints(prev => prev.map(c => (c.id || c.complaint_id) === id ? { ...c, status } : c));
      showAlert('success', `Complaint marked as ${status}`);
    } catch { showAlert('error', 'Failed to update complaint'); }
  };

  const handleEventStatus = async (eventId, status) => {
    try {
      await api.put(`/events/${eventId}/status`, { status });
      setEvents(prev => prev.map(e => (e.id || e.event_id) === eventId ? { ...e, status } : e));
      showAlert('success', `Event ${status}`);
    } catch { showAlert('error', 'Failed to update event status'); }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await api.post('/auth/invite-admin', { email: inviteEmail });
      setInviteEmail('');
      showAlert('success', `✅ Invite sent to ${inviteEmail}`);
    } catch { showAlert('error', 'Failed to send invite'); }
  };

  const TAB_DEFS = [
    { key: 'PENDING',    badge: pending.length,    badgeColor: 'var(--red)' },
    { key: 'USERS',      badge: null },
    { key: 'EVENTS',     badge: events.filter(e => e.status === 'pending').length || null, badgeColor: 'var(--gold)' },
    { key: 'COMPLAINTS', badge: complaints.filter(c => !c.status || c.status === 'pending').length || null, badgeColor: '#FF5252' },
  ];

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px' }}>
            System Administration
          </div>
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontFamily: 'var(--text-display)', fontSize: '22px', color: 'var(--red)', letterSpacing: '0.08em', textShadow: 'var(--red-glow)' }}>
                ADMIN DASHBOARD
              </h1>
              <button onClick={refresh} style={{ background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.25)', borderRadius: '8px', color: 'var(--red)', cursor: 'pointer', padding: '6px 12px', fontSize: '16px' }}>⟳</button>
            </div>
            <span className="badge badge-red">
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red)', marginRight: '5px' }} />
              ADMIN ACCESS
            </span>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: '16px' }}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div></div>
            <div className="stat-icon">👥</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Pending Approval</div><div className="stat-value">{pending.length}</div></div>
            <div className="stat-icon">⏳</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Total Events</div><div className="stat-value">{events.length}</div></div>
            <div className="stat-icon">🎵</div>
          </div>
          <div className="stat-card red">
            <div><div className="stat-label">Complaints</div><div className="stat-value">{complaints.length}</div></div>
            <div className="stat-icon">📋</div>
          </div>
        </div>

        {/* Invite Admin */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--red)', flexShrink: 0 }}>
            📧 INVITE ADMIN
          </div>
          <input className="form-control" placeholder="admin@example.com" value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()}
            style={{ flex: 1, minWidth: '200px' }} />
          <button className="btn btn-danger btn-sm" onClick={handleInvite}>SEND INVITE</button>
        </div>

        {/* Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {TAB_DEFS.map(tab => (
              <button key={tab.key} className={`panel-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.key}
                {tab.badge > 0 && (
                  <span style={{ marginLeft: '6px', background: tab.badgeColor, color: '#000', borderRadius: '20px', padding: '1px 6px', fontSize: '9px', fontWeight: '700' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>

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
                    <div key={u.u_id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid rgba(212,168,83,0.2)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                      {/* Avatar / photo */}
                      {u.profile_picture ? (
                        <img src={u.profile_picture} alt={u.unique_username}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(212,168,83,0.3)' }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="avatar avatar-sm" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--cyan)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                          {u.unique_username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--text-display)', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {u.unique_username}
                        </div>
                        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                          {u.email} · Registered {formatDate(u.created_at)}
                        </div>
                      </div>
                      <span className={`badge ${roleColor(u.role)}`}>{u.role?.toUpperCase()}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(u.u_id)}>✓ APPROVE</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(u.u_id)}>✗ REJECT</button>
                      </div>
                    </div>
                  ))}
                </div>
              )

            ) : activeTab === 'USERS' ? (
              users.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">NO USERS</div></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.u_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="avatar avatar-sm" style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', color: 'var(--cyan)', fontSize: '11px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {u.unique_username?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontFamily: 'var(--text-display)', fontSize: '13px' }}>{u.unique_username}</span>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td><span className={`badge ${roleColor(u.role)}`}>{u.role?.toUpperCase()}</span></td>
                          <td>
                            <span className={`badge ${u.status === 'active' ? 'badge-green' : u.status === 'rejected' ? 'badge-red' : 'badge-gold'}`}>
                              {(u.status || 'ACTIVE').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                            {formatDate(u.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )

            ) : activeTab === 'EVENTS' ? (
              events.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🎵</div><div className="empty-title">NO EVENTS</div></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Organizer</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {events.map(ev => {
                        const id = ev.id || ev.event_id;
                        return (
                          <tr key={id}>
                            <td style={{ fontFamily: 'var(--text-display)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ev.title}
                            </td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {ev.organizer_name || '—'}
                            </td>
                            <td style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatDate(ev.event_date)}
                            </td>
                            <td>
                              <span className="badge" style={{ color: statusColor[ev.status] || '#888', background: `${statusColor[ev.status]}18`, border: `1px solid ${statusColor[ev.status]}44` }}>
                                {(ev.status || '—').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {ev.status === 'pending' && (
                                  <>
                                    <button className="btn btn-primary btn-sm" onClick={() => handleEventStatus(id, 'approved')}>✓ Approve</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleEventStatus(id, 'cancelled')}>✗ Reject</button>
                                  </>
                                )}
                                {ev.status === 'approved' && (
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleEventStatus(id, 'live')}>▶ Set Live</button>
                                )}
                                {ev.status === 'live' && (
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleEventStatus(id, 'ended')}>⏹ End</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )

            ) : (
              /* COMPLAINTS */
              complaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">NO COMPLAINTS</div>
                  <div className="empty-sub">No complaints have been submitted</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {complaints.map(c => {
                    const cid = c.id || c.complaint_id;
                    return (
                      <div key={cid} style={{ background: 'var(--bg-secondary)', border: `1px solid ${c.status === 'resolved' ? 'rgba(0,191,166,0.2)' : 'rgba(255,82,82,0.2)'}`, borderLeft: `3px solid ${c.status === 'resolved' ? 'var(--cyan)' : 'var(--red)'}`, borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                        <div className="flex-between" style={{ marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontFamily: 'var(--text-display)', fontSize: '13px', color: 'var(--gold)', marginBottom: '3px' }}>
                              📍 {c.event_title || '—'}
                            </div>
                            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>
                              Reported by: <span style={{ color: 'var(--cyan)' }}>{c.reporter_name || c.user_name || '—'}</span>
                              {' · '}{formatDate(c.created_at)}
                            </div>
                          </div>
                          <span className={`badge ${c.status === 'resolved' ? 'badge-green' : c.status === 'dismissed' ? 'badge-gold' : 'badge-red'}`}>
                            {(c.status || 'PENDING').toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--text-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
                          {c.description}
                        </div>
                        {(!c.status || c.status === 'pending') && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleComplaintStatus(cid, 'resolved')}>✓ Resolve</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleComplaintStatus(cid, 'dismissed')}>Dismiss</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
