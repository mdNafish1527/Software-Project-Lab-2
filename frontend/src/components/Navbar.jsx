import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import zarinPhoto from '../assets/zarin.jpg';
import nafishPhoto from '../assets/nafish.jpg';

const nameAnimStyles = `
  @keyframes glitchText {
    0%   { clip-path: inset(0 0 95% 0); transform: translateX(-4px); }
    10%  { clip-path: inset(30% 0 50% 0); transform: translateX(4px); }
    20%  { clip-path: inset(60% 0 20% 0); transform: translateX(-2px); }
    30%  { clip-path: inset(0 0 0 0);     transform: translateX(0); }
    100% { clip-path: inset(0 0 0 0);     transform: translateX(0); }
  }

  @keyframes typewriter {
    from { width: 0; }
    to   { width: 100%; }
  }

  @keyframes blinkCursor {
    0%, 100% { border-color: transparent; }
    50%       { border-color: currentColor; }
  }

  @keyframes namePulse {
    0%, 100% { text-shadow: 0 0 8px currentColor, 0 0 20px currentColor; }
    50%       { text-shadow: 0 0 2px currentColor; }
  }

  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .team-name-zarin {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    font-family: 'Orbitron', monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #ff6b6b;
    text-shadow: 0 0 8px #ff6b6b, 0 0 20px rgba(255,107,107,0.4);
    border-right: 2px solid #ff6b6b;
    animation:
      typewriter 1.4s steps(18) 0.3s forwards,
      blinkCursor 0.7s step-end 0.3s 3,
      namePulse 3s ease-in-out 2s infinite;
  }

  .team-name-nafish {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    font-family: 'Orbitron', monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #4fc3f7;
    text-shadow: 0 0 8px #4fc3f7, 0 0 20px rgba(79,195,247,0.4);
    border-right: 2px solid #4fc3f7;
    animation:
      typewriter 1.2s steps(14) 1.8s forwards,
      blinkCursor 0.7s step-end 1.8s 3,
      namePulse 3s ease-in-out 3.5s infinite;
  }

  .team-chip-animated {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 16px 24px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    animation: slideUpFade 0.6s ease forwards;
    opacity: 0;
  }

  .team-chip-animated:nth-child(1) { animation-delay: 0.1s; }
  .team-chip-animated:nth-child(2) { animation-delay: 0.4s; }

  .photo-wrapper {
    position: relative;
    display: inline-block;
  }

  .photo-ring-zarin {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: conic-gradient(#ff6b6b, #ff9a9a, #ff6b6b) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    animation: spin 4s linear infinite;
  }

  .photo-ring-nafish {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: conic-gradient(#4fc3f7, #81d4fa, #4fc3f7) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    animation: spin 4s linear infinite reverse;
  }

  .role-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 3px;
    margin-top: 2px;
  }
`;

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
      <style>{nameAnimStyles}</style>

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
      <div className="team-banner" style={{ padding: '20px 24px' }}>
        <div className="team-label">
          <span className="team-label-small">Developed by Team</span>
          <div className="team-label-name">CLEMENTINE</div>
        </div>

        <div style={{ width: '1px', height: '60px', background: 'rgba(255,255,255,0.1)' }} />

        <div className="team-members" style={{ gap: '32px' }}>

          {/* Kazi Zarin Tasnim */}
          <div className="team-chip-animated">
            <div className="photo-wrapper">
              <div className="photo-ring-zarin" />
              <img
                src={zarinPhoto}
                alt="Kazi Zarin Tasnim"
                style={{
                  width: '160px', height: '160px', borderRadius: '50%',
                  objectFit: 'cover', border: '4px solid #c0392b',
                  display: 'block', position: 'relative', zIndex: 1
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="team-name-zarin">Kazi Zarin Tasnim</div>
              <div className="role-tag" style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)' }}>
                Developer
              </div>
            </div>
          </div>

          {/* Nafish Salehin */}
          <div className="team-chip-animated">
            <div className="photo-wrapper">
              <div className="photo-ring-nafish" />
              <img
                src={nafishPhoto}
                alt="Nafish Salehin"
                style={{
                  width: '160px', height: '160px', borderRadius: '50%',
                  objectFit: 'cover', border: '4px solid #1a6ca8',
                  display: 'block', position: 'relative', zIndex: 1
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="team-name-nafish">Nafish Salehin</div>
              <div className="role-tag" style={{ color: '#4fc3f7', background: 'rgba(79,195,247,0.1)', border: '1px solid rgba(79,195,247,0.3)' }}>
                Developer
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
