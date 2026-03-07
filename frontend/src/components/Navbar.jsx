import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import zarinPhoto from '../assets/zarin.jpg';
import nafishPhoto from '../assets/nafish.jpg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'audience':  return '/dashboard/audience';
      case 'singer':    return '/dashboard/singer';
      case 'organizer': return '/dashboard/organizer';
      case 'admin':     return '/dashboard/admin';
      default:          return '/';
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">🎵</div>
          <div className="navbar-brand-text">
            <span className="navbar-title">GAANBAJNA</span>
            <span className="navbar-subtitle">IIT — DU PROJECT</span>
          </div>
        </Link>

        <div className="navbar-nav">
          <Link to="/"            className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/concerts"    className={`nav-link ${isActive('/concerts') ? 'active' : ''}`}>Concerts</Link>
          <Link to="/singers"     className={`nav-link ${isActive('/singers') ? 'active' : ''}`}>Artists</Link>
          <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}>Market</Link>
          {user && (
            <Link to={getDashboardPath()} className={`nav-link ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="navbar-status">
          <span><span className="status-dot"></span>&nbsp;SYSTEM ONLINE</span>
          <span className="navbar-clock">{clock}</span>
        </div>

        <div className="navbar-actions" style={{ marginLeft: '20px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div className="avatar avatar-sm" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'var(--cyan)' }}>{user.name?.split(' ')[0]}</span>
                <span style={{ padding: '2px 6px', background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)' }}>{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Team Banner */}
      <div className="team-banner">
        <div className="team-label">
          <span className="team-label-small">Developed by Team</span>
          <div className="team-label-name">CLEMENTINE</div>
        </div>

        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

        <div className="team-members">
          <div className="team-chip">
            <img
              src={zarinPhoto}
              alt="Kazi Zarin Tasnim"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c0392b', flexShrink: 0 }}
            />
            Kazi Zarin Tasnim
          </div>
          <div className="team-chip">
            <img
              src={nafishPhoto}
              alt="Nafish Salehin"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a6ca8', flexShrink: 0 }}
            />
            Nafish Salehin
          </div>
        </div>
      </div>
    </>
  );
}
