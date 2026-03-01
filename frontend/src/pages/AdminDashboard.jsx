import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('Overview');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [puRes, auRes, cRes, evRes] = await Promise.all([
        API.get('/users/pending'),
        API.get('/users/all'),
        API.get('/complaints'),
        API.get('/events/admin/all'),
      ]);
      setPendingUsers(puRes.data);
      setAllUsers(auRes.data);
      setComplaints(cRes.data);
      setEvents(evRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await API.post(`/users/${id}/approve`);
      toast.success('Account approved!');
      loadData();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id) => {
    try {
      await API.post(`/users/${id}/reject`);
      toast.success('Account rejected');
      loadData();
    } catch { toast.error('Failed'); }
  };

  const handleApproveURL = async (event_id) => {
    try {
      await API.post(`/events/${event_id}/approve-url`);
      toast.success('Custom URL approved');
      loadData();
    } catch { toast.error('Failed'); }
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/invite-admin', { email: inviteEmail });
      toast.success(`Admin invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const menu = ['Overview', 'Pending Approvals', 'All Users', 'Complaints', 'Events', 'Invite Admin'];

  const menuIcons = { 'Overview':'📊', 'Pending Approvals':'⏳', 'All Users':'👥', 'Complaints':'⚠️', 'Events':'🎭', 'Invite Admin':'🔗' };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div style={{ padding: '8px 14px 20px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>A</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{user?.username}</p>
              <p style={{ color: 'var(--muted)', fontSize: 11 }}>Admin</p>
            </div>
          </div>
        </div>
        <p className="sidebar-label">Admin Panel</p>
        {menu.map(m => (
          <button key={m} className={`sidebar-link ${active === m ? 'active' : ''}`} onClick={() => setActive(m)}>
            {menuIcons[m]} {m}
            {m === 'Pending Approvals' && pendingUsers.length > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: 11 }}>{pendingUsers.length}</span>
            )}
          </button>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
        <button className="sidebar-link" onClick={() => { logout(); navigate('/'); }} style={{ color: 'var(--red)' }}>🚪 Logout</button>
      </aside>

      <main className="main-content">
        {active === 'Overview' && (
          <div>
            <h2 style={{ marginBottom: 8 }}>Admin Dashboard</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Platform overview and management.</p>
            <div className="grid grid-4">
              <div className="stat-card"><div className="stat-value">{allUsers.length}</div><div className="stat-label">Total Users</div></div>
              <div className="stat-card"><div className="stat-value">{pendingUsers.length}</div><div className="stat-label">Pending Approvals</div></div>
              <div className="stat-card"><div className="stat-value">{events.filter(e => e.status === 'live').length}</div><div className="stat-label">Live Events</div></div>
              <div className="stat-card"><div className="stat-value">{complaints.length}</div><div className="stat-label">Complaints</div></div>
            </div>

            {pendingUsers.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ marginBottom: 14 }}>⏳ Pending Approvals</h3>
                {pendingUsers.map(u => (
                  <PendingUserCard key={u.u_id} user={u} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}
          </div>
        )}

        {active === 'Pending Approvals' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>⏳ Pending Approvals</h2>
            {pendingUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <p>No pending approvals!</p>
              </div>
            ) : pendingUsers.map(u => (
              <PendingUserCard key={u.u_id} user={u} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}

        {active === 'All Users' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>👥 All Users</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.u_id}>
                      <td style={{ color: 'var(--muted)' }}>#{u.u_id}</td>
                      <td style={{ fontWeight: 600 }}>{u.unique_username}</td>
                      <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'singer' ? 'badge-gold' : 'badge-gray'}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.status === 'active' ? 'badge-green' : u.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>{u.status}</span></td>
                      <td style={{ color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {active === 'Complaints' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>⚠️ Complaints</h2>
            {complaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>No complaints received.</div>
            ) : complaints.map(c => (
              <div key={c.complaint_id} className="card" style={{ marginBottom: 14 }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>Complaint #{c.complaint_id}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ marginBottom: 6 }}>
                    <strong>Reporter:</strong> {c.reporter_name} &nbsp;·&nbsp; <strong>Event:</strong> {c.event_title}
                  </p>
                  {c.suspect_name && <p style={{ color: 'var(--muted)', fontSize: 13 }}>Suspect: {c.suspect_name}</p>}
                  <p style={{ marginTop: 10, lineHeight: 1.7, color: '#ccc' }}>{c.description}</p>
                  {c.evidence && (
                    <a href={c.evidence} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>
                      View Evidence
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {active === 'Events' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>🎭 All Events</h2>
            {events.map(e => (
              <div key={e.event_id} className="card" style={{ marginBottom: 12 }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h4>{e.title}</h4>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{e.city} · {new Date(e.date).toLocaleDateString()}</p>
                    {e.custom_url && e.custom_url_status === 'pending' && (
                      <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 4 }}>Custom URL pending: {e.custom_url}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className={`badge ${e.status === 'live' ? 'badge-green' : 'badge-gray'}`}>{e.status}</span>
                    {e.custom_url_status === 'pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleApproveURL(e.event_id)}>Approve URL</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {active === 'Invite Admin' && (
          <div style={{ maxWidth: 420 }}>
            <h2 style={{ marginBottom: 8 }}>🔗 Invite Admin</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Send a one-time invitation link to create a new admin account.</p>
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleInviteAdmin}>
                  <div className="form-group">
                    <label>Invitee Email</label>
                    <input className="form-control" type="email" placeholder="admin@email.com"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary">Send Invitation</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const PendingUserCard = ({ user, onApprove, onReject }) => (
  <div className="card" style={{ marginBottom: 14 }}>
    <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {user.profile_picture ? (
        <img src={user.profile_picture} alt={user.unique_username}
          style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
      ) : (
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 18 }}>
          {user.unique_username[0].toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600 }}>{user.unique_username}</p>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>{user.email}</p>
        <span className="badge badge-gold" style={{ marginTop: 4 }}>{user.role}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => onApprove(user.u_id)}>✓ Approve</button>
        <button className="btn btn-danger btn-sm" onClick={() => onReject(user.u_id)}>✗ Reject</button>
      </div>
    </div>
  </div>
);

export default AdminDashboard;