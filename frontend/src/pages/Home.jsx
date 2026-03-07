import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    artists: 24,
    events: 142,
    tickets: 2180,
    upcoming: 9,
  });

  useEffect(() => {
    api.get('/events')
      .then(res => setEvents((res.data || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* ── Stats Grid ── */}
        <div className="stats-grid" style={{ marginBottom: '28px' }}>
          <div className="stat-card cyan fade-in">
            <div>
              <div className="stat-label">Active Artists</div>
              <div className="stat-value">{stats.artists}</div>
              <div className="stat-trend">↑ 3 joined this week</div>
            </div>
            <div className="stat-icon">🎤</div>
          </div>
          <div className="stat-card gold fade-in" style={{ animationDelay: '0.05s' }}>
            <div>
              <div className="stat-label">Open Events</div>
              <div className="stat-value">{stats.events}</div>
              <div className="stat-trend">↑ 12 new this week</div>
            </div>
            <div className="stat-icon">🎫</div>
          </div>
          <div className="stat-card green fade-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="stat-label">Tickets Sold</div>
              <div className="stat-value">{stats.tickets.toLocaleString()}</div>
              <div className="stat-trend">↑ 94% fill rate</div>
            </div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="stat-card red fade-in" style={{ animationDelay: '0.15s' }}>
            <div>
              <div className="stat-label">Upcoming</div>
              <div className="stat-value">{stats.upcoming}</div>
              <div className="stat-trend">↓ 2 this weekend</div>
            </div>
            <div className="stat-icon">⚡</div>
          </div>
        </div>

        {/* ── Hero + Quick Actions ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '20px',
          marginBottom: '28px'
        }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #080f1e 0%, #0b1628 60%, #0d1a20 100%)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative glow */}
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '200px', height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute', bottom: '-60px', left: '30%',
              width: '300px', height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(176,64,255,0.06) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '11px',
              letterSpacing: '0.2em', color: 'var(--text-dim)',
              textTransform: 'uppercase', marginBottom: '12px'
            }}>
              🎵 Music Event Platform
            </div>
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '38px',
              fontWeight: 900, color: 'var(--cyan)',
              letterSpacing: '0.06em', lineHeight: 1.1,
              textShadow: 'var(--cyan-glow)', marginBottom: '16px'
            }}>
              GAANBAJNA
            </h1>
            <p style={{
              fontFamily: 'var(--text-body)', fontSize: '15px',
              color: 'var(--text-secondary)', lineHeight: 1.7,
              maxWidth: '480px', marginBottom: '28px'
            }}>
              Where every beat tells a story. Discover live concerts, book your favorite artists,
              and manage events all in one place.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/concerts" className="btn btn-solid-cyan btn-lg">
                ⚡ BROWSE CONCERTS
              </Link>
              {!user && (
                <Link to="/register" className="btn btn-gold btn-lg">
                  JOIN NOW
                </Link>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="panel">
            <div className="panel-tabs">
              <button className="panel-tab active">QUICK ACCESS</button>
            </div>
            <div className="panel-body">
              {!user ? (
                <>
                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '11px',
                    color: 'var(--text-dim)', letterSpacing: '0.1em',
                    marginBottom: '16px', textTransform: 'uppercase'
                  }}>
                    Get Started
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'I\'m an Audience', sub: 'Buy tickets, attend events', icon: '👥', color: 'cyan' },
                      { label: 'I\'m an Artist', sub: 'Manage bookings & merch', icon: '🎤', color: 'gold' },
                      { label: 'I\'m an Organizer', sub: 'Host concerts & events', icon: '🎪', color: 'green' },
                    ].map(item => (
                      <Link key={item.label} to="/register" style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        background: 'rgba(255,255,255,0.02)',
                        textDecoration: 'none', transition: 'var(--transition)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = `rgba(0,212,255,0.3)`;
                        e.currentTarget.style.background = 'rgba(0,212,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}>
                        <div style={{ fontSize: '22px' }}>{item.icon}</div>
                        <div>
                          <div style={{ fontFamily: 'var(--text-body)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                            {item.sub}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <hr className="divider" />
                  <Link to="/login" className="btn btn-ghost btn-block" style={{ textAlign: 'center' }}>
                    Already have an account? Login
                  </Link>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    padding: '14px', background: 'var(--cyan-dim)',
                    border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--cyan)'
                  }}>
                    ● LOGGED IN AS {user.name?.toUpperCase()}
                    <div style={{ color: 'var(--text-dim)', fontSize: '10px', marginTop: '4px', letterSpacing: '0.1em' }}>
                      ROLE: {user.role?.toUpperCase()}
                    </div>
                  </div>
                  <Link to="/concerts" className="btn btn-primary btn-block">View Concerts</Link>
                  <Link to="/marketplace" className="btn btn-gold btn-block">Browse Market</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Live Events ── */}
        <div style={{ marginBottom: '8px' }} className="flex-between">
          <div>
            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px'
            }}>
              Live Listings
            </div>
            <h2 style={{
              fontFamily: 'var(--text-display)', fontSize: '18px', color: 'var(--text-primary)',
              letterSpacing: '0.05em'
            }}>
              UPCOMING CONCERTS
            </h2>
          </div>
          <Link to="/concerts" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : events.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <div className="empty-title">NO EVENTS LISTED</div>
              <div className="empty-sub">Check back soon for upcoming concerts</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {events.map(ev => (
              <Link key={ev.id} to={`/concerts/${ev.id}`} style={{ textDecoration: 'none' }}>
                <div className="event-card">
                  <div className="event-card-image" style={{
                    background: 'linear-gradient(135deg, #080f1e 0%, #0f1e35 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    🎵
                  </div>
                  <div className="event-card-body">
                    <div className="event-card-title">{ev.title}</div>
                    <div className="event-card-meta">
                      <span>📍 {ev.venue || ev.location || '—'}</span>
                      <span>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}</span>
                    </div>
                    <div className="flex-between">
                      <span className="badge badge-cyan">
                        ৳{ev.min_price || '—'}
                      </span>
                      <span className="badge badge-green">LIVE</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Platform Features ── */}
        <div style={{ marginTop: '40px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px'
          }}>System Capabilities</div>
          <h2 style={{
            fontFamily: 'var(--text-display)', fontSize: '18px', color: 'var(--text-primary)',
            letterSpacing: '0.05em', marginBottom: '20px'
          }}>PLATFORM FEATURES</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { icon: '🎫', title: 'TICKET MANAGEMENT', desc: 'Buy tickets online and receive QR codes via email for seamless venue entry', color: 'cyan' },
              { icon: '🎤', title: 'ARTIST BOOKING', desc: 'Organizers can browse and directly book verified singers for their events', color: 'gold' },
              { icon: '🛒', title: 'MERCHANDISE STORE', desc: 'Artists and organizers can list merchandise with smart recommendations', color: 'green' },
              { icon: '📊', title: 'LIVE DASHBOARDS', desc: 'Role-specific dashboards for audience, artists, organizers and admins', color: 'cyan' },
              { icon: '🔐', title: 'SECURE AUTH', desc: 'JWT-based authentication with email OTP verification for all users', color: 'gold' },
              { icon: '📱', title: 'QR SCANNER', desc: 'Real-time QR code scanning for organizers to validate event tickets', color: 'green' },
            ].map(f => (
              <div key={f.title} style={{
                background: 'var(--bg-card)', border: 'var(--border-dim)',
                borderLeft: `2px solid var(--${f.color})`,
                borderRadius: 'var(--radius-lg)', padding: '20px',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>{f.icon}</div>
                <div style={{
                  fontFamily: 'var(--text-mono)', fontSize: '11px',
                  letterSpacing: '0.1em', color: `var(--${f.color})`,
                  marginBottom: '8px'
                }}>
                  {f.title}
                </div>
                <div style={{
                  fontFamily: 'var(--text-body)', fontSize: '13px',
                  color: 'var(--text-secondary)', lineHeight: 1.6
                }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
