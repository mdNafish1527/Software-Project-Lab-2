import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const dashboardPath = user ? `/${user.role}/dashboard` : '/login';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎵 Gaan<span>Bajna</span>
      </Link>
      <ul className="nav-links">
        <li><Link to="/concerts" className={isActive('/concerts')}>Concerts</Link></li>
        <li><Link to="/marketplace" className={isActive('/marketplace')}>Marketplace</Link></li>
        <li><Link to="/singers" className={isActive('/singers')}>Artists</Link></li>
        {user ? (
          <>
            <li><Link to={dashboardPath}>Dashboard</Link></li>
            <li>
              <button onClick={handleLogout} className="nav-links-btn">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/register" className="nav-btn-primary btn btn-sm btn-primary">Sign Up</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;