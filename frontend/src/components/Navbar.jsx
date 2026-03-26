import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
    0%   { width: 0; opacity: 1; }
    50%  { width: 100%; opacity: 1; }
    75%  { width: 100%; opacity: 1; }
    85%  { width: 100%; opacity: 0; }
    90%  { width: 0; opacity: 0; }
    100% { width: 0; opacity: 1; }
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
  @keyframes cartBounce {
    0%,100% { transform: scale(1); }
    30%     { transform: scale(1.4); }
    60%     { transform: scale(0.9); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .team-name-zarin {
    display: inline-block; overflow: hidden; white-space: nowrap; width: 0;
    font-family: 'Orbitron', monospace; font-size: 15px; font-weight: 700;
    letter-spacing: 0.12em; color: #ff6b6b;
    text-shadow: 0 0 8px #ff6b6b, 0 0 20px rgba(255,107,107,0.4);
    border-right: 2px solid #ff6b6b;
    animation: typewriter 3.5s steps(18) 0s infinite, blinkCursor 0.5s step-end infinite, namePulse 3.5s ease-in-out infinite;
  }
  .team-name-nafish {
    display: inline-block; overflow: hidden; white-space: nowrap; width: 0;
    font-family: 'Orbitron', monospace; font-size: 15px; font-weight: 700;
    letter-spacing: 0.12em; color: #4fc3f7;
    text-shadow: 0 0 8px #4fc3f7, 0 0 20px rgba(79,195,247,0.4);
    border-right: 2px solid #4fc3f7;
    animation: typewriter 3.5s steps(14) 0.5s infinite, blinkCursor 0.5s step-end 0.5s infinite, namePulse 3.5s ease-in-out 0.5s infinite;
  }
  .team-chip-animated {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    padding: 16px 24px; border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
    animation: slideUpFade 0.6s ease forwards; opacity: 0;
  }
  .team-chip-animated:nth-child(1) { animation-delay: 0.1s; }
  .team-chip-animated:nth-child(2) { animation-delay: 0.4s; }
  .photo-wrapper { position: relative; display: inline-block; }
  .photo-ring-zarin {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid transparent;
    background: conic-gradient(#ff6b6b, #ff9a9a, #ff6b6b) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out; mask-composite: exclude;
    animation: spin 4s linear infinite;
  }
  .photo-ring-nafish {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid transparent;
    background: conic-gradient(#4fc3f7, #81d4fa, #4fc3f7) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out; mask-composite: exclude;
    animation: spin 4s linear infinite reverse;
  }
  .role-tag {
    font-family: 'Share Tech Mono', monospace; font-size: 9px;
    letter-spacing: 0.18em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 3px; margin-top: 2px;
  }
  .cart-btn-nav {
    position: relative; display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .cart-badge-nav {
    position: absolute; top: -8px; right: -8px;
    background: #D4A853; color: #000; border-radius: 50%;
    width: 18px; height: 18px; font-size: 10px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    font-family: monospace;
  }
  .cart-badge-nav.bounce { animation: cartBounce 0.4s ease; }
`;

export default function Navbar({ onOpenCart }) {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();   // ← cartCount from unified CartContext
  const navigate  = useNavigate();
  const location  = useLocation();

  const [clock, setClock]       = useState('');
  const [prevCount, setPrevCount] = useState(0);
  const [bouncing, setBouncing]  = useState(false);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-GB', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Bounce badge when new item added
  useEffect(() => {
    if (cartCount > prevCount) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);
    }
    setPrevCount(cartCount);
  }, [cartCount]);

  const handleLogout = () => { logout(); navigate('/login'); };
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

        <div className="navbar-actions" style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* ── Cart Button ── opens sidebar, not a page ── */}
          <button
            onClick={onOpenCart}
            className="cart-btn-nav"
            title={cartCount > 0 ? `${cartCount} item(s) in cart` : 'Cart is empty'}
            style={{
              background:  cartCount > 0 ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.04)',
              border:      cartCount > 0 ? '1px solid rgba(212,168,83,0.35)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '6px 12px',
              color:  cartCount > 0 ? '#D4A853' : '#666',
              fontSize: '18px', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            🛒
            {cartCount > 0 && (
              <span className={`cart-badge-nav${bouncing ? ' bounce' : ''}`}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div className="avatar avatar-sm" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'var(--cyan)' }}>{user.username}</span>
                <span style={{ padding: '2px 6px', background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
                  {user.role}
                </span>
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

    </>
  );
}
