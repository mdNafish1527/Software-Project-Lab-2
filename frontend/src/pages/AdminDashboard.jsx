import { useState, useEffect } from 'react';
import api from '../api';

const TABS = ['PENDING', 'USERS', 'EVENTS', 'COMPLAINTS'];

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

const roleColor = (role) => {
  if (role === 'admin') return 'badge-red';
  if (role === 'singer') return 'badge-gold';
  if (role === 'organizer') return 'badge-cyan';
  return 'badge-green';
};

const statusColor = {
  approved: '#00BFA6',
  active: '#00BFA6',
  live: '#ff4444',
  ended: '#888',
  cancelled: '#FF5252',
  rejected: '#FF5252',
  suspended: '#FF5252',
  pending: '#D4A853',
  email_unverified: '#D4A853',
  reviewed: '#D4A853',
  resolved: '#00BFA6',
  dismissed: '#888',
};

function getUserId(user) {
  return user?.user_id || user?.u_id || user?.id;
}

function getEventId(event) {
  return event?.event_id || event?.id;
}

function getComplaintId(complaint) {
  return complaint?.complaint_id || complaint?.id;
}

function getStatusBadgeClass(status) {
  if (status === 'approved' || status === 'active') return 'badge-green';
  if (status === 'rejected' || status === 'suspended') return 'badge-red';
  return 'badge-gold';
}

function normalizeMedia(media) {
  if (!media) return [];

  if (Array.isArray(media)) return media;

  if (typeof media === 'string') {
    try {
      const parsed = JSON.parse(media);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch {
      return [{ url: media, name: 'Attachment' }];
    }
  }

  if (typeof media === 'object') return [media];

  return [];
}

function buildFileUrl(url) {
  if (!url) return '#';
  if (String(url).startsWith('http')) return url;

  const baseURL =
    process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  if (String(url).startsWith('/uploads')) return `${baseURL}${url}`;
  return `${baseURL}/uploads/${url}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('PENDING');

  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);

  const [guidelines, setGuidelines] = useState({});
  const [suspendReasons, setSuspendReasons] = useState({});
  const [adminInviteEmail, setAdminInviteEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [pendingRes, usersRes, complaintsRes, eventsRes] = await Promise.all([
          api
            .get('/admin/pending-accounts')
            .catch(() => api.get('/users/pending').catch(() => ({ data: [] }))),

          api.get('/users/all').catch(() => ({ data: [] })),

          api
            .get('/complaints/admin/all')
            .catch(() => api.get('/complaints/all').catch(() => ({ data: [] }))),

          api.get('/events').catch(() => ({ data: { events: [] } })),
        ]);

        if (!mounted) return;

        setPending(Array.isArray(pendingRes.data) ? pendingRes.data : pendingRes.data?.users || []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || []);
        setComplaints(
          Array.isArray(complaintsRes.data)
            ? complaintsRes.data
            : complaintsRes.data?.complaints || []
        );
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data?.events || []);
      } catch (err) {
        console.error('Admin dashboard load error:', err);
        showAlert('error', 'Failed to load admin dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleSendAdminInvite = async () => {
    const email = adminInviteEmail.trim().toLowerCase();

    if (!email) {
      showAlert('error', 'Please enter an email address');
      return;
    }

    try {
      await api.post('/auth/invite-admin', { email });
      showAlert('success', `Admin invitation sent to ${email}`);
      setAdminInviteEmail('');
    } catch (err) {
      console.error('Admin invite error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to send admin invitation');
    }
  };

  const handleApprove = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      showAlert('error', 'User ID not found');
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/approve`).catch(() =>
        api.post(`/users/${userId}/approve`)
      );

      setPending((prev) => prev.filter((u) => getUserId(u) !== userId));

      setUsers((prev) =>
        prev.map((u) =>
          getUserId(u) === userId
            ? { ...u, account_status: 'approved', status: 'active' }
            : u
        )
      );

      showAlert('success', 'Account approved successfully');
    } catch (err) {
      console.error('Approve error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to approve account');
    }
  };

  const handleReject = async (user) => {
    const userId = getUserId(user);
    const text = guidelines[userId];

    if (!userId) {
      showAlert('error', 'User ID not found');
      return;
    }

    if (!text || !text.trim()) {
      showAlert('error', 'Please write guidelines before rejecting this account');
      return;
    }

    try {
      await api
        .put(`/admin/users/${userId}/reject`, { guidelines: text.trim() })
        .catch(() => api.post(`/users/${userId}/reject`, { guidelines: text.trim() }));

      setPending((prev) => prev.filter((u) => getUserId(u) !== userId));

      setUsers((prev) =>
        prev.map((u) =>
          getUserId(u) === userId
            ? {
                ...u,
                account_status: 'rejected',
                status: 'rejected',
                admin_guidelines: text.trim(),
              }
            : u
        )
      );

      setGuidelines((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      showAlert('success', 'Account rejected with guidelines');
    } catch (err) {
      console.error('Reject error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to reject account');
    }
  };

  const handleSuspend = async (user) => {
    const userId = getUserId(user);
    const reason = suspendReasons[userId] || 'Violation of platform rules';

    if (!userId) {
      showAlert('error', 'User ID not found');
      return;
    }

    if (user.role === 'admin') {
      showAlert('error', 'Admin account cannot be suspended from here');
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/suspend`, { reason });

      setUsers((prev) =>
        prev.map((u) =>
          getUserId(u) === userId
            ? {
                ...u,
                account_status: 'suspended',
                status: 'suspended',
                suspended_reason: reason,
              }
            : u
        )
      );

      showAlert('success', 'Account suspended successfully');
    } catch (err) {
      console.error('Suspend error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to suspend account');
    }
  };

  const handleUnsuspend = async (user) => {
    const userId = getUserId(user);

    if (!userId) {
      showAlert('error', 'User ID not found');
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/unsuspend`);

      setUsers((prev) =>
        prev.map((u) =>
          getUserId(u) === userId
            ? {
                ...u,
                account_status: 'approved',
                status: 'active',
                suspended_reason: null,
                suspended_at: null,
              }
            : u
        )
      );

      showAlert('success', 'Account unsuspended successfully');
    } catch (err) {
      console.error('Unsuspend error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to unsuspend account');
    }
  };

  const handleComplaintStatus = async (id, status) => {
    if (!id) {
      showAlert('error', 'Complaint ID not found');
      return;
    }

    try {
      await api
        .put(`/complaints/${id}/status`, { status })
        .catch(() => api.put(`/complaints/admin/${id}/status`, { status }));

      setComplaints((prev) =>
        prev.map((c) => (getComplaintId(c) === id ? { ...c, status } : c))
      );

      showAlert('success', `Complaint marked as ${status}`);
    } catch (err) {
      console.error('Complaint status error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to update complaint');
    }
  };

  const handleEventStatus = async (event, status) => {
    const eventId = getEventId(event);

    if (!eventId) {
      showAlert('error', 'Event ID not found');
      return;
    }

    try {
      if (status === 'ended') {
        await api
          .put(`/admin/events/${eventId}/end`)
          .catch(() => api.put(`/events/${eventId}/status`, { status }));
      } else {
        await api
          .put(`/events/${eventId}/status`, { status })
          .catch(() => api.put(`/admin/events/${eventId}/status`, { status }));
      }

      setEvents((prev) =>
        prev.map((e) =>
          getEventId(e) === eventId ? { ...e, status, event_status: status } : e
        )
      );

      showAlert('success', `Event ${status}`);
    } catch (err) {
      console.error('Event status error:', err);
      showAlert('error', err.response?.data?.message || 'Failed to update event status');
    }
  };

  const TAB_DEFS = [
    {
      key: 'PENDING',
      badge: pending.length,
      badgeColor: 'var(--red)',
    },
    {
      key: 'USERS',
      badge: null,
    },
    {
      key: 'EVENTS',
      badge:
        events.filter((e) => e.status === 'pending' || e.event_status === 'pending').length ||
        null,
      badgeColor: 'var(--gold)',
    },
    {
      key: 'COMPLAINTS',
      badge: complaints.filter((c) => !c.status || c.status === 'pending').length || null,
      badgeColor: '#FF5252',
    },
  ];

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
            System Administration
          </div>

          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1
                style={{
                  fontFamily: 'var(--text-display)',
                  fontSize: '22px',
                  color: 'var(--red)',
                  letterSpacing: '0.08em',
                  textShadow: 'var(--red-glow)',
                }}
              >
                ADMIN DASHBOARD
              </h1>

              <button
                onClick={refresh}
                style={{
                  background: 'rgba(255,68,102,0.08)',
                  border: '1px solid rgba(255,68,102,0.25)',
                  borderRadius: '8px',
                  color: 'var(--red)',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: '16px',
                }}
              >
                ⟳
              </button>
            </div>

            <span className="badge badge-red">
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--red)',
                  marginRight: '5px',
                }}
              />
              ADMIN ACCESS
            </span>
          </div>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: '16px' }}>
            {alert.text}
          </div>
        )}

        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '24px' }}
        >
          <div className="stat-card cyan">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{users.length}</div>
            </div>
            <div className="stat-icon">👥</div>
          </div>

          <div className="stat-card gold">
            <div>
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value">{pending.length}</div>
            </div>
            <div className="stat-icon">⏳</div>
          </div>

          <div className="stat-card green">
            <div>
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{events.length}</div>
            </div>
            <div className="stat-icon">🎵</div>
          </div>

          <div className="stat-card red">
            <div>
              <div className="stat-label">Complaints</div>
              <div className="stat-value">{complaints.length}</div>
            </div>
            <div className="stat-icon">📋</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,68,102,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--red)',
              flexShrink: 0,
            }}
          >
            📧 INVITE NEW ADMIN
          </div>

          <input
            className="form-control"
            type="email"
            placeholder="newadmin@example.com"
            value={adminInviteEmail}
            onChange={(e) => setAdminInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAdminInvite()}
            style={{ flex: 1, minWidth: '220px' }}
          />

          <button className="btn btn-danger btn-sm" onClick={handleSendAdminInvite}>
            SEND ADMIN INVITE
          </button>
        </div>

        <div className="panel">
          <div className="panel-tabs">
            {TAB_DEFS.map((tab) => (
              <button
                key={tab.key}
                className={`panel-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.key}
                {tab.badge > 0 && (
                  <span
                    style={{
                      marginLeft: '6px',
                      background: tab.badgeColor,
                      color: '#000',
                      borderRadius: '20px',
                      padding: '1px 6px',
                      fontSize: '9px',
                      fontWeight: '700',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pending.map((u) => {
                    const userId = getUserId(u);

                    return (
                      <div
                        key={userId}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '14px',
                          padding: '14px 16px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid rgba(212,168,83,0.2)',
                          borderLeft: '3px solid var(--gold)',
                          borderRadius: 'var(--radius-sm)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {u.profile_picture ? (
                          <img
                            src={buildFileUrl(u.profile_picture)}
                            alt={u.unique_username}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid rgba(212,168,83,0.3)',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="avatar avatar-sm"
                            style={{
                              background: 'var(--cyan-dim)',
                              border: '1px solid rgba(0,212,255,0.3)',
                              color: 'var(--cyan)',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                            }}
                          >
                            {u.unique_username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div
                            style={{
                              fontFamily: 'var(--text-display)',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              marginBottom: '2px',
                            }}
                          >
                            {u.unique_username || 'Unnamed User'}
                          </div>

                          <div
                            style={{
                              fontFamily: 'var(--text-mono)',
                              fontSize: '11px',
                              color: 'var(--text-dim)',
                              marginBottom: '8px',
                            }}
                          >
                            {u.email || 'No email'} · Registered {formatDate(u.created_at)}
                          </div>

                          <textarea
                            className="form-control"
                            placeholder="Write guidelines for better improvement before rejection..."
                            value={guidelines[userId] || ''}
                            onChange={(e) =>
                              setGuidelines((prev) => ({
                                ...prev,
                                [userId]: e.target.value,
                              }))
                            }
                            style={{ width: '100%', minHeight: '70px', resize: 'vertical' }}
                          />
                        </div>

                        <span className={`badge ${roleColor(u.role)}`}>
                          {u.role?.toUpperCase() || 'USER'}
                        </span>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(u)}>
                            ✓ APPROVE
                          </button>

                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(u)}>
                            ✗ REJECT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeTab === 'USERS' ? (
              users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">NO USERS</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Admin Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((u) => {
                        const userId = getUserId(u);
                        const currentStatus = u.account_status || u.status || 'approved';

                        return (
                          <tr key={userId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  className="avatar avatar-sm"
                                  style={{
                                    background: 'var(--cyan-dim)',
                                    border: '1px solid rgba(0,212,255,0.3)',
                                    color: 'var(--cyan)',
                                    fontSize: '11px',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {u.unique_username?.charAt(0).toUpperCase() || '?'}
                                </div>

                                <span style={{ fontFamily: 'var(--text-display)', fontSize: '13px' }}>
                                  {u.unique_username || 'Unnamed'}
                                </span>
                              </div>
                            </td>

                            <td
                              style={{
                                fontFamily: 'var(--text-mono)',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {u.email || '—'}
                            </td>

                            <td>
                              <span className={`badge ${roleColor(u.role)}`}>
                                {u.role?.toUpperCase() || 'USER'}
                              </span>
                            </td>

                            <td>
                              <span className={`badge ${getStatusBadgeClass(currentStatus)}`}>
                                {String(currentStatus).toUpperCase()}
                              </span>
                            </td>

                            <td
                              style={{
                                fontFamily: 'var(--text-mono)',
                                fontSize: '11px',
                                color: 'var(--text-dim)',
                              }}
                            >
                              {formatDate(u.created_at)}
                            </td>

                            <td>
                              {u.role === 'admin' ? (
                                <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                                  Protected
                                </span>
                              ) : currentStatus === 'suspended' ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleUnsuspend(u)}
                                >
                                  UNSUSPEND
                                </button>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  <input
                                    className="form-control"
                                    placeholder="Suspend reason"
                                    value={suspendReasons[userId] || ''}
                                    onChange={(e) =>
                                      setSuspendReasons((prev) => ({
                                        ...prev,
                                        [userId]: e.target.value,
                                      }))
                                    }
                                    style={{ width: '160px', height: '32px', fontSize: '11px' }}
                                  />

                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleSuspend(u)}
                                  >
                                    SUSPEND
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'EVENTS' ? (
              events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-title">NO EVENTS</div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Organizer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {events.map((ev) => {
                        const id = getEventId(ev);
                        const currentStatus = ev.event_status || ev.status || 'active';

                        return (
                          <tr key={id}>
                            <td
                              style={{
                                fontFamily: 'var(--text-display)',
                                fontSize: '13px',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ev.title || 'Untitled Event'}
                            </td>

                            <td
                              style={{
                                fontFamily: 'var(--text-mono)',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {ev.organizer_name || '—'}
                            </td>

                            <td
                              style={{
                                fontFamily: 'var(--text-mono)',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {formatDate(ev.event_date || ev.date)}
                            </td>

                            <td>
                              <span
                                className="badge"
                                style={{
                                  color: statusColor[currentStatus] || '#888',
                                  background: `${statusColor[currentStatus] || '#888'}18`,
                                  border: `1px solid ${statusColor[currentStatus] || '#888'}44`,
                                }}
                              >
                                {String(currentStatus).toUpperCase()}
                              </span>
                            </td>

                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {currentStatus === 'pending' && (
                                  <>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleEventStatus(ev, 'approved')}
                                    >
                                      ✓ Approve
                                    </button>

                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleEventStatus(ev, 'cancelled')}
                                    >
                                      ✗ Reject
                                    </button>
                                  </>
                                )}

                                {currentStatus === 'approved' && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleEventStatus(ev, 'live')}
                                  >
                                    ▶ Set Live
                                  </button>
                                )}

                                {currentStatus !== 'ended' && currentStatus !== 'cancelled' && (
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleEventStatus(ev, 'ended')}
                                  >
                                    ⏹ End Event
                                  </button>
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
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">NO COMPLAINTS</div>
                <div className="empty-sub">No complaints have been submitted</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {complaints.map((c) => {
                  const cid = getComplaintId(c);
                  const files = normalizeMedia(c.media);

                  return (
                    <div
                      key={cid}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${
                          c.status === 'resolved'
                            ? 'rgba(0,191,166,0.2)'
                            : 'rgba(255,82,82,0.2)'
                        }`,
                        borderLeft: `3px solid ${
                          c.status === 'resolved' ? 'var(--cyan)' : 'var(--red)'
                        }`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        className="flex-between"
                        style={{ marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--text-display)',
                              fontSize: '13px',
                              color: 'var(--gold)',
                              marginBottom: '3px',
                            }}
                          >
                            📍 {c.event_title || '—'}
                          </div>

                          <div
                            style={{
                              fontFamily: 'var(--text-mono)',
                              fontSize: '11px',
                              color: 'var(--text-dim)',
                            }}
                          >
                            Reported by:{' '}
                            <span style={{ color: 'var(--cyan)' }}>
                              {c.reporter_name || c.user_name || '—'}
                            </span>
                            {' · '}
                            {formatDate(c.created_at)}
                          </div>
                        </div>

                        <span
                          className={`badge ${
                            c.status === 'resolved'
                              ? 'badge-green'
                              : c.status === 'dismissed'
                              ? 'badge-gold'
                              : 'badge-red'
                          }`}
                        >
                          {(c.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--text-body)',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          marginBottom: '10px',
                        }}
                      >
                        {c.text_content || 'No complaint text'}
                      </div>

                      {files.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '10px',
                          }}
                        >
                          {files.map((file, index) => (
                            <a
                              key={`${cid}-file-${index}`}
                              href={buildFileUrl(file.url || file.path || file.filename || file)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                            >
                              View Attachment {files.length > 1 ? index + 1 : ''}
                            </a>
                          ))}
                        </div>
                      )}

                      {(!c.status || c.status === 'pending') && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleComplaintStatus(cid, 'resolved')}
                          >
                            ✓ Resolve
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleComplaintStatus(cid, 'dismissed')}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
