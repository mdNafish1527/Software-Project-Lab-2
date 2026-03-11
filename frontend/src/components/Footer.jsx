import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="navbar-logo-icon" style={{ width: '32px', height: '32px', fontSize: '14px' }}>🎵</div>
            <div className="footer-brand-title">GAANBAJNA</div>
          </div>
          <p className="footer-brand-sub">
            Where every beat tells a story.<br />
            A music event platform connecting<br />
            artists, organizers, and audiences.
          </p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <span className="badge badge-cyan">IIT – DU</span>
            <span className="badge badge-gold">Semester Final</span>
          </div>
        </div>

        {/* Platform links */}
        <div>
          <div className="footer-col-title">Platform</div>
          <ul className="footer-links">
            <li><Link to="/concerts">Browse Concerts</Link></li>
            <li><Link to="/singers">Discover Artists</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
            <li><Link to="/register">Join Now</Link></li>
          </ul>
        </div>

        {/* Account links */}
        <div>
          <div className="footer-col-title">Account</div>
          <ul className="footer-links">
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/forgot-password">Reset Password</Link></li>
            <li><Link to="/dashboard/audience">My Tickets</Link></li>
          </ul>
        </div>

        {/* Tech stack */}
        <div>
          <div className="footer-col-title">Tech Stack</div>
          <ul className="footer-links">
            <li><a href="#">React.js</a></li>
            <li><a href="#">Node.js + Express</a></li>
            <li><a href="#">MySQL Database</a></li>
            <li><a href="#">JWT Auth</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copy">
          © {year} GaanBajna — All rights reserved
        </div>
        <div className="footer-devs">
          <span style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
            BUILT BY
          </span>
          <div className="dev-chip">
            <div className="team-avatar kz" style={{ width: '20px', height: '20px', fontSize: '8px' }}>KZ</div>
            <span style={{ color: 'var(--text-secondary)' }}>Kazi Zarin Tasnim</span>
          </div>
          <div className="dev-chip">
            <div className="team-avatar ns" style={{ width: '20px', height: '20px', fontSize: '8px' }}>NS</div>
            <span style={{ color: 'var(--text-secondary)' }}>Nafish Salehin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
