import React from 'react';
import { Link } from 'react-router-dom';

// ⚠️ REPLACE THESE with actual photo imports or paths once added:
// import zarinPhoto from '../assets/zarin.jpg';
// import nafishPhoto from '../assets/nafish.jpg';
// Then replace the dev-avatar-placeholder divs below with:
// <img src={zarinPhoto} alt="Kazi Zarin Tasnim" className="dev-avatar" />

const Footer = () => {
  return (
    <>
      {/* Developers Section */}
      <section className="developers">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 className="section-title">Meet the Developers</h2>
            <p className="section-sub">The minds behind GaanBajna</p>
          </div>
          <div className="dev-grid">
            <div className="dev-card">
              {/* Replace with <img src={zarinPhoto} alt="Kazi Zarin Tasnim" className="dev-avatar" /> */}
              <div className="dev-avatar-placeholder">👩‍💻</div>
              <div className="dev-name">Kazi Zarin Tasnim</div>
              <div className="dev-role">Full Stack Developer</div>
            </div>
            <div className="dev-card">
              {/* Replace with <img src={nafishPhoto} alt="Nafish Salehin" className="dev-avatar" /> */}
              <div className="dev-avatar-placeholder">👨‍💻</div>
              <div className="dev-name">Nafish Salehin</div>
              <div className="dev-role">Full Stack Developer</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <h2>🎵 GaanBajna</h2>
              <p>Bangladesh's premier music event platform. Connecting artists, organizers, and audiences through the power of music.</p>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/concerts">Browse Concerts</Link></li>
                <li><Link to="/singers">Find Artists</Link></li>
                <li><Link to="/marketplace">Marketplace</Link></li>
                <li><Link to="/register">Join Us</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Roles</h4>
              <ul>
                <li><a href="#">For Audiences</a></li>
                <li><a href="#">For Singers</a></li>
                <li><a href="#">For Organizers</a></li>
                <li><a href="#">Admin Panel</a></li>
              </ul>
            </div>
          </div>
          <hr className="footer-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              © {new Date().getFullYear()} GaanBajna. Developed by Kazi Zarin Tasnim & Nafish Salehin.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Semester Final Project 🎓</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;