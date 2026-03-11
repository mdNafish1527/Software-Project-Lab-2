import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DEFAULT_CONCERTS = [
  {
    id: 'default-1',
    title: 'বসন্ত উৎসব ২০২৪',
    subtitle: 'Basanta Utsab — Spring Festival',
    venue: 'টিএসসি চত্বর, ঢাকা বিশ্ববিদ্যালয়',
    venue_en: 'TSC, University of Dhaka',
    event_date: '2024-02-14',
    singer_name: 'ছায়ানট শিল্পীগোষ্ঠী',
    genre: 'Rabindra Sangeet',
    price: '৳200',
    tag: 'CULTURAL',
    tag_color: 'badge-gold',
    emoji: '🌸',
    highlight: false,
  },
  {
    id: 'default-2',
    title: 'IIT-DU Tech Fest Concert',
    subtitle: 'Annual Cultural Night — Flagship Event',
    venue: 'IIT ভবন, ঢাকা বিশ্ববিদ্যালয়',
    venue_en: 'IIT Building, University of Dhaka',
    event_date: '2024-03-15',
    singer_name: 'Shironamhin & Artcell',
    genre: 'Rock / Alternative',
    price: '৳150',
    tag: 'IIT-DU',
    tag_color: 'badge-cyan',
    emoji: '⚡',
    highlight: true,
  },
  {
    id: 'default-3',
    title: 'একুশে ফেব্রুয়ারি স্মরণ সন্ধ্যা',
    subtitle: 'International Mother Language Day Concert',
    venue: 'কেন্দ্রীয় শহীদ মিনার, ঢাকা',
    venue_en: 'Central Shaheed Minar, Dhaka',
    event_date: '2024-02-21',
    singer_name: 'Fakir Alamgir & Friends',
    genre: 'Folk / Patriotic',
    price: 'Free',
    tag: 'SPECIAL',
    tag_color: 'badge-red',
    emoji: '🕊️',
    highlight: false,
  },
  {
    id: 'default-4',
    title: 'DU Cultural Week — Closing Night',
    subtitle: 'Grand Finale of ঢাবি সাংস্কৃতিক সপ্তাহ',
    venue: 'কলাভবন মাঠ, ঢাকা বিশ্ববিদ্যালয়',
    venue_en: 'Kala Bhaban Field, University of Dhaka',
    event_date: '2024-04-10',
    singer_name: 'Tahsan Khan',
    genre: 'Pop / Fusion',
    price: '৳300',
    tag: 'UNIVERSITY',
    tag_color: 'badge-purple',
    emoji: '🎶',
    highlight: false,
  },
  {
    id: 'default-5',
    title: 'পহেলা বৈশাখ মেলা কনসার্ট',
    subtitle: 'Pohela Boishakh — Bengali New Year 1431',
    venue: 'রমনা বটমূল, ঢাকা',
    venue_en: 'Ramna Batamul, Dhaka',
    event_date: '2024-04-14',
    singer_name: 'Momtaz Begum & Bari Siddiqui',
    genre: 'Baul / Folk',
    price: 'Free',
    tag: 'CULTURAL',
    tag_color: 'badge-gold',
    emoji: '🎊',
    highlight: false,
  },
  {
    id: 'default-6',
    title: 'IIT-DU Freshers Night 2025',
    subtitle: 'Welcome Ceremony for New Batch',
    venue: 'IIT অডিটোরিয়াম, ঢাকা বিশ্ববিদ্যালয়',
    venue_en: 'IIT Auditorium, University of Dhaka',
    event_date: '2025-01-20',
    singer_name: 'Hasan S. Iqbal',
    genre: 'Pop / Acoustic',
    price: '৳100',
    tag: 'IIT-DU',
    tag_color: 'badge-cyan',
    emoji: '🎓',
    highlight: true,
  },
];

const STATS = [
  { label: 'Active Artists',    value: '87',  trend: '↑ 4 on duty today',    color: 'cyan',  icon: '🎤' },
  { label: 'Open Events',       value: '142', trend: '↑ 12 new this week',   color: 'gold',  icon: '🎫' },
  { label: 'Solved This Month', value: '218', trend: '↑ 92% success rate',   color: 'green', icon: '✓'  },
  { label: 'Critical Cases',    value: '9',   trend: '↓ 3 resolved today',   color: 'red',   icon: '⚠'  },
];

export default function Home() {
  const { user } = useAuth();
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    api.get('/events')
      .then(res => setLiveEvents((res.data || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* ── Stats ── */}
        <div className="stats-grid" style={{ marginBottom: '28px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`stat-card ${s.color} fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-trend">{s.trend}</div>
              </div>
              <div className="stat-icon">{s.icon}</div>
            </div>
          ))}
        </div>

        {/* ── IIT-DU Hero Banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #040d1a 0%, #071628 50%, #040d1a 100%)',
          border: '1px solid rgba(0,212,255,0.25)',
          borderLeft: '4px solid var(--cyan)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 40px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* BG decorations */}
          <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-80px', left:'20%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(176,64,255,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', gap:'32px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                <span style={{
                  fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.2em',
                  textTransform:'uppercase', padding:'4px 10px',
                  background:'var(--cyan-dim)', border:'1px solid rgba(0,212,255,0.4)',
                  borderRadius:'3px', color:'var(--cyan)'
                }}>
                  ● IIT — DU FLAGSHIP
                </span>
                <span style={{
                  fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.15em',
                  padding:'4px 10px', background:'rgba(255,179,0,0.1)',
                  border:'1px solid rgba(255,179,0,0.3)', borderRadius:'3px', color:'var(--gold)'
                }}>
                  University of Dhaka
                </span>
              </div>

              <h1 style={{
                fontFamily:'var(--text-display)', fontSize:'36px', fontWeight:900,
                color:'var(--cyan)', letterSpacing:'0.08em', textShadow:'var(--cyan-glow)',
                lineHeight:1.1, marginBottom:'8px'
              }}>
                GAANBAJNA
              </h1>
              <div style={{
                fontFamily:'var(--text-body)', fontSize:'16px', color:'var(--gold)',
                letterSpacing:'0.05em', marginBottom:'14px', fontWeight:600
              }}>
                গানবাজনা — Where Every Beat Tells a Story
              </div>
              <p style={{
                fontFamily:'var(--text-body)', fontSize:'14px',
                color:'var(--text-secondary)', lineHeight:1.8, maxWidth:'520px', marginBottom:'24px'
              }}>
                The official music event platform of <strong style={{color:'var(--cyan)'}}>Institute of Information Technology (IIT)</strong>,
                University of Dhaka. Connecting Bangladeshi artists, organizers, and audiences
                through the power of music and technology.
              </p>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                <Link to="/concerts" className="btn btn-solid-cyan btn-lg">⚡ BROWSE CONCERTS</Link>
                {!user && <Link to="/register" className="btn btn-gold btn-lg">JOIN NOW</Link>}
              </div>
            </div>

            {/* IIT-DU Info Box */}
            <div style={{
              background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.2)',
              borderRadius:'var(--radius-lg)', padding:'24px', minWidth:'220px'
            }}>
              <div style={{
                fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.2em',
                textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'14px'
              }}>IIT — DU At a Glance</div>
              {[
                { label: 'Department', value: 'IIT, DU' },
                { label: 'Location',   value: 'Nilkhet, Dhaka' },
                { label: 'Founded',    value: '2001' },
                { label: 'Program',    value: 'Software Project Lab II' },
                { label: 'Team',       value: 'CLEMENTINE' },
              ].map(row => (
                <div key={row.label} style={{
                  display:'flex', justifyContent:'space-between', gap:'12px',
                  padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)',
                  fontFamily:'var(--text-mono)', fontSize:'11px'
                }}>
                  <span style={{ color:'var(--text-dim)', letterSpacing:'0.08em' }}>{row.label}</span>
                  <span style={{ color:'var(--cyan)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Default Concerts ── */}
        <div style={{ marginBottom: '10px' }} className="flex-between">
          <div>
            <div style={{
              fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.2em',
              textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'4px'
            }}>
              ঢাকা বিশ্ববিদ্যালয় · University of Dhaka
            </div>
            <h2 style={{
              fontFamily:'var(--text-display)', fontSize:'18px',
              color:'var(--text-primary)', letterSpacing:'0.05em'
            }}>
              FEATURED CONCERTS
            </h2>
          </div>
          <Link to="/concerts" className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
          gap:'16px',
          marginBottom:'40px'
        }}>
          {DEFAULT_CONCERTS.map((ev, i) => (
            <div key={ev.id} style={{
              background: ev.highlight
                ? 'linear-gradient(135deg, #071628 0%, #0b1e36 100%)'
                : 'var(--bg-card)',
              border: ev.highlight
                ? '1px solid rgba(0,212,255,0.35)'
                : 'var(--border-dim)',
              borderTop: ev.highlight ? '3px solid var(--cyan)' : '3px solid rgba(255,179,0,0.3)',
              borderRadius:'var(--radius-lg)',
              overflow:'hidden',
              transition:'transform 0.2s, box-shadow 0.2s',
              animation:`fadeInUp 0.4s ease ${i * 0.07}s both`,
              cursor:'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = ev.highlight
                ? '0 12px 40px rgba(0,212,255,0.15)'
                : '0 12px 40px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              {/* Card Header */}
              <div style={{
                height:'120px',
                background: ev.highlight
                  ? 'linear-gradient(135deg, #071a2e 0%, #0e2540 100%)'
                  : 'linear-gradient(135deg, #080f1e 0%, #0f1e35 100%)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'52px', position:'relative'
              }}>
                {ev.emoji}
                <div style={{ position:'absolute', top:'10px', right:'10px', display:'flex', gap:'6px' }}>
                  <span className={`badge ${ev.tag_color}`}>{ev.tag}</span>
                  {ev.highlight && (
                    <span className="badge badge-cyan" style={{ animation:'pulse 2s infinite' }}>★ FEATURED</span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding:'16px' }}>
                <div style={{
                  fontFamily:'var(--text-display)', fontSize:'14px',
                  color: ev.highlight ? 'var(--cyan)' : 'var(--text-primary)',
                  letterSpacing:'0.04em', marginBottom:'4px',
                  textShadow: ev.highlight ? 'var(--cyan-glow)' : 'none'
                }}>
                  {ev.title}
                </div>
                <div style={{
                  fontFamily:'var(--text-mono)', fontSize:'10px',
                  color:'var(--text-dim)', marginBottom:'10px', letterSpacing:'0.05em'
                }}>
                  {ev.subtitle}
                </div>
                <div style={{
                  display:'flex', flexDirection:'column', gap:'4px',
                  fontFamily:'var(--text-mono)', fontSize:'11px',
                  color:'var(--text-secondary)', marginBottom:'12px'
                }}>
                  <span>📍 {ev.venue}</span>
                  <span style={{ fontSize:'10px', color:'var(--text-dim)', paddingLeft:'18px' }}>{ev.venue_en}</span>
                  <span>📅 {new Date(ev.event_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
                  <span>🎤 {ev.singer_name}</span>
                  <span>🎵 {ev.genre}</span>
                </div>
                <div className="flex-between">
                  <span className="badge badge-gold">{ev.price}</span>
                  <span style={{
                    fontFamily:'var(--text-mono)', fontSize:'11px',
                    color: ev.highlight ? 'var(--cyan)' : 'var(--text-secondary)',
                    letterSpacing:'0.05em'
                  }}>
                    DETAILS →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Live API Events (if any) ── */}
        {liveEvents.length > 0 && (
          <>
            <div style={{ marginBottom:'10px' }} className="flex-between">
              <div>
                <div style={{
                  fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.2em',
                  textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'4px'
                }}>
                  Live Listings
                </div>
                <h2 style={{
                  fontFamily:'var(--text-display)', fontSize:'18px',
                  color:'var(--text-primary)', letterSpacing:'0.05em'
                }}>
                  UPCOMING EVENTS
                </h2>
              </div>
              <Link to="/concerts" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',
              gap:'16px', marginBottom:'40px'
            }}>
              {liveEvents.map(ev => (
                <Link key={ev.id} to={`/concerts/${ev.id}`} style={{ textDecoration:'none' }}>
                  <div className="event-card">
                    <div style={{
                      height:'140px', background:'linear-gradient(135deg, #080f1e 0%, #0f1e35 100%)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px',
                      position:'relative'
                    }}>
                      🎵
                      <div style={{ position:'absolute', top:'10px', right:'10px' }}>
                        <span className="badge badge-green">LIVE</span>
                      </div>
                    </div>
                    <div className="event-card-body">
                      <div className="event-card-title">{ev.title}</div>
                      <div className="event-card-meta">
                        <span>📍 {ev.venue || ev.location || '—'}</span>
                        <span>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex-between">
                        <span className="badge badge-cyan">৳{ev.min_price || '—'}</span>
                        <span style={{ fontFamily:'var(--text-mono)', fontSize:'11px', color:'var(--cyan)' }}>VIEW →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── Platform Features ── */}
        <div>
          <div style={{
            fontFamily:'var(--text-mono)', fontSize:'10px', letterSpacing:'0.2em',
            textTransform:'uppercase', color:'var(--text-dim)', marginBottom:'4px'
          }}>
            System Capabilities
          </div>
          <h2 style={{
            fontFamily:'var(--text-display)', fontSize:'18px',
            color:'var(--text-primary)', letterSpacing:'0.05em', marginBottom:'20px'
          }}>
            PLATFORM FEATURES
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { icon:'🎫', title:'TICKET MANAGEMENT',  desc:'Buy tickets online and receive QR codes via email for seamless venue entry',         color:'cyan'  },
              { icon:'🎤', title:'ARTIST BOOKING',     desc:'Organizers can browse and directly book verified Bangladeshi singers for events',    color:'gold'  },
              { icon:'🛒', title:'MERCHANDISE STORE',  desc:'Artists and organizers can list and sell merchandise with smart cart system',         color:'green' },
              { icon:'📊', title:'LIVE DASHBOARDS',    desc:'Role-specific dashboards for audience, artists, organizers and admins',               color:'cyan'  },
              { icon:'🔐', title:'SECURE AUTH',        desc:'JWT-based authentication with email OTP verification for all users',                  color:'gold'  },
              { icon:'📱', title:'QR SCANNER',         desc:'Real-time QR code scanning for organizers to validate event entry tickets',           color:'green' },
            ].map(f => (
              <div key={f.title} style={{
                background:'var(--bg-card)', border:'var(--border-dim)',
                borderLeft:`2px solid var(--${f.color})`,
                borderRadius:'var(--radius-lg)', padding:'20px',
                transition:'transform 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ fontSize:'24px', marginBottom:'10px' }}>{f.icon}</div>
                <div style={{
                  fontFamily:'var(--text-mono)', fontSize:'11px',
                  letterSpacing:'0.1em', color:`var(--${f.color})`, marginBottom:'8px'
                }}>
                  {f.title}
                </div>
                <div style={{
                  fontFamily:'var(--text-body)', fontSize:'13px',
                  color:'var(--text-secondary)', lineHeight:1.6
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
