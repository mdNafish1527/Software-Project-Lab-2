import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import zarinPhoto from '../assets/zarin.jpg';
import nafishPhoto from '../assets/nafish.jpg';
import heroImage from '../assets/hero-banner.jpeg'; // ← Add your image here

const animStyles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes glow-line {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes typewriter {
    0%   { width: 0; }
    40%  { width: 100%; }
    60%  { width: 100%; }
    80%  { width: 0; opacity: 0; }
    81%  { opacity: 1; }
    100% { width: 0; }
  }
  @keyframes blink {
    0%, 100% { border-color: transparent; }
    50%      { border-color: currentColor; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes kenBurns {
    0%   { transform: scale(1) translate(0, 0); }
    50%  { transform: scale(1.08) translate(-1%, -1%); }
    100% { transform: scale(1) translate(0, 0); }
  }
  @keyframes overlayShift {
    0%   { opacity: 0.85; }
    50%  { opacity: 0.75; }
    100% { opacity: 0.85; }
  }
  .anim-fade-up { animation: fadeUp 0.7s ease both; }
  .anim-fade-in { animation: fadeIn 0.6s ease both; }
  .anim-slide-left { animation: slideInLeft 0.7s ease both; }
  .anim-slide-right { animation: slideInRight 0.7s ease both; }
  .hero-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    filter: blur(80px); opacity: 0.12;
  }
  .hero-line {
    position: absolute; height: 1px; overflow: hidden;
    background: rgba(255,255,255,0.04);
  }
  .hero-line::after {
    content: ''; position: absolute; top: 0; left: 0;
    width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    animation: glow-line 4s ease-in-out infinite;
  }
  .hero-image-container {
    position: relative; border-radius: 20px; overflow: hidden;
    border: 1px solid rgba(0,212,255,0.15);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,212,255,0.06);
  }
  .hero-image-container img {
    width: 100%; height: 100%; object-fit: cover;
    animation: kenBurns 20s ease-in-out infinite;
  }
  .hero-image-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(4,13,26,0.4) 0%, rgba(4,13,26,0.1) 40%, rgba(4,13,26,0.3) 100%);
    animation: overlayShift 20s ease-in-out infinite;
  }
  .hero-image-badge {
    position: absolute; bottom: 16px; left: 16px; right: 16px;
    background: rgba(4,13,26,0.7); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(0,212,255,0.2); border-radius: 12px;
    padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;
  }
  .hero-image-corner {
    position: absolute; width: 24px; height: 24px;
    border-color: var(--cyan); opacity: 0.4;
  }
  .hero-image-corner.tl { top: 10px; left: 10px; border-top: 2px solid; border-left: 2px solid; }
  .hero-image-corner.tr { top: 10px; right: 10px; border-top: 2px solid; border-right: 2px solid; }
  .hero-image-corner.bl { bottom: 10px; left: 10px; border-bottom: 2px solid; border-left: 2px solid; }
  .hero-image-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid; border-right: 2px solid; }
  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.06);
    transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .glass-card:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(0,212,255,0.2);
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,212,255,0.05);
  }
  .concert-card {
    position: relative; overflow: hidden; border-radius: 16px;
    background: var(--bg-card); border: 1px solid var(--border-dim);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    height: 100%;
  }
  .concert-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 3px; background: linear-gradient(90deg, var(--cyan), var(--gold));
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.4s ease;
  }
  .concert-card:hover::before { transform: scaleX(1); }
  .concert-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,255,0.15);
  }
  .concert-card.live-card { border-color: rgba(255,68,68,0.3); }
  .concert-card.live-card::before {
    background: linear-gradient(90deg, #ff4444, #ff6b6b);
    transform: scaleX(1);
  }
  .feature-item {
    padding: 28px; border-radius: 16px;
    background: var(--bg-card); border: 1px solid var(--border-dim);
    transition: all 0.3s ease; position: relative; overflow: hidden;
  }
  .feature-item:hover { transform: translateY(-3px); }
  .feature-icon-box {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 16px;
  }
  .stat-block {
    text-align: center; padding: 32px 20px; border-radius: 16px;
    background: var(--bg-card); border: 1px solid var(--border-dim);
    transition: all 0.3s ease; position: relative; overflow: hidden;
  }
  .stat-block::before {
    content: ''; position: absolute; top: 0; left: 50%;
    transform: translateX(-50%); width: 60%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .stat-block:hover::before { opacity: 1; }
  .stat-block:hover { border-color: rgba(0,212,255,0.2); }
  .stat-number {
    font-family: 'Orbitron', monospace; font-size: 40px; font-weight: 900;
    letter-spacing: 0.05em;
    animation: countUp 0.8s ease both;
  }
  .team-name-zarin {
    display: inline-block; overflow: hidden; white-space: nowrap; width: 0;
    font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
    letter-spacing: 0.1em; color: #ff6b6b;
    border-right: 2px solid #ff6b6b;
    animation: typewriter 4s steps(18) 0.5s infinite, blink 0.5s step-end 0.5s infinite;
  }
  .team-name-nafish {
    display: inline-block; overflow: hidden; white-space: nowrap; width: 0;
    font-family: 'Orbitron', monospace; font-size: 14px; font-weight: 700;
    letter-spacing: 0.1em; color: #4fc3f7;
    border-right: 2px solid #4fc3f7;
    animation: typewriter 4s steps(14) 1s infinite, blink 0.5s step-end 1s infinite;
  }
  .photo-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px solid transparent;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out; mask-composite: exclude;
    animation: spin 5s linear infinite;
  }
  .photo-ring-zarin {
    background: conic-gradient(#ff6b6b, #ff9a9a, transparent, #ff6b6b) border-box;
  }
  .photo-ring-nafish {
    background: conic-gradient(#4fc3f7, #81d4fa, transparent, #4fc3f7) border-box;
    animation-direction: reverse;
  }
  .live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #ff4444; position: relative; display: inline-block;
  }
  .live-dot::before {
    content: ''; position: absolute; inset: -4px;
    border-radius: 50%; border: 2px solid #ff4444;
    animation: pulse-ring 1.5s ease-out infinite;
  }
  .section-tag {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--text-mono); font-size: 10px;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-dim); padding: 6px 14px;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 100px; background: rgba(255,255,255,0.02);
  }
  .section-tag .dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--cyan);
  }
  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 10px;
    font-family: var(--text-mono); font-size: 12px;
    font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; text-decoration: none;
    transition: all 0.3s ease; position: relative; overflow: hidden;
  }
  .cta-primary {
    background: linear-gradient(135deg, #00d4ff, #0099cc);
    color: #040d1a; border: none;
    box-shadow: 0 4px 20px rgba(0,212,255,0.25);
  }
  .cta-primary:hover {
    box-shadow: 0 8px 32px rgba(0,212,255,0.4);
    transform: translateY(-2px);
  }
  .cta-secondary {
    background: transparent; color: var(--gold);
    border: 1px solid rgba(255,179,0,0.3);
  }
  .cta-secondary:hover {
    background: rgba(255,179,0,0.08);
    border-color: rgba(255,179,0,0.5);
  }
  .cta-ghost {
    background: transparent; color: var(--text-secondary);
    border: 1px solid var(--border-dim);
  }
  .cta-ghost:hover {
    color: var(--text-primary);
    border-color: rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.03);
  }
`;

const STATUS_BADGE = {
  live:      { label: 'LIVE',     cls: 'badge-red',   dot: true  },
  approved:  { label: 'UPCOMING', cls: 'badge-green', dot: false },
  ended:     { label: 'ENDED',    cls: 'badge-gold',  dot: false },
  cancelled: { label: 'CANCELLED',cls: 'badge-red',   dot: false },
  pending:   { label: 'PENDING',  cls: 'badge-gold',  dot: false },
};

const FEATURED_CONCERTS = [
  { id:'f-1', title:'IIT-DU Tech Fest 2025 — Mega Night', subtitle:'Annual Tech Fest Concert · Grand Finale', venue:'টিএসসি চত্বর, ঢাকা বিশ্ববিদ্যালয়', event_date:'2026-12-20', singer_name:'Aurthohin', genre:'Rock / Metal', price:'৳200', tag:'IIT-DU', tagColor:'cyan', emoji:'⚡', featured:true },
  { id:'f-2', title:'DU 104th Founding Day', subtitle:'১০৪তম প্রতিষ্ঠাবার্ষিকী সাংস্কৃতিক সন্ধ্যা', venue:'বটমূল, ঢাকা বিশ্ববিদ্যালয়', event_date:'2026-07-01', singer_name:'Shironamhin', genre:'Classical / Cultural', price:'৳150', tag:'DU', tagColor:'gold', emoji:'🏛️', featured:false },
  { id:'f-3', title:'পহেলা বৈশাখ ১৪৩৩', subtitle:'Bengali New Year · TSC Grand Festival', venue:'টিএসসি চত্বর, ঢাকা বিশ্ববিদ্যালয়', event_date:'2026-04-14', singer_name:'Hawa Band', genre:'Folk / Baul / Cultural', price:'Free', tag:'CULTURAL', tagColor:'gold', emoji:'🎊', featured:false },
  { id:'f-4', title:'Victory Day Rock Concert', subtitle:'৫৫তম মহান বিজয় দিবস কনসার্ট', venue:'কেন্দ্রীয় শহীদ মিনার, ঢাবি', event_date:'2026-12-16', singer_name:'Cryptic Fate & Shironamhin', genre:'Rock / Patriotic', price:'৳150', tag:'SPECIAL', tagColor:'red', emoji:'🇧🇩', featured:false },
  { id:'f-5', title:'Ekushey February Night', subtitle:'আন্তর্জাতিক মাতৃভাষা দিবস রাত্রি কনসার্ট', venue:'কেন্দ্রীয় শহীদ মিনার, ঢাবি', event_date:'2027-02-21', singer_name:'Shironamhin', genre:'Cultural / Memorial', price:'Free', tag:'EKUSHEY', tagColor:'red', emoji:'🕊️', featured:false },
  { id:'f-6', title:'Aurthohin 25th Anniversary', subtitle:'রজতজয়ন্তী — 25 Years of Bangladeshi Rock', venue:'টিএসসি মাঠ, ঢাকা বিশ্ববিদ্যালয়', event_date:'2026-12-31', singer_name:'Aurthohin', genre:'Rock / Classic', price:'৳250', tag:'LEGEND', tagColor:'purple', emoji:'🎸', featured:true },
];

const FEATURES = [
  { icon:'🎫', title:'Smart Ticketing', desc:'Purchase tickets online with instant QR code delivery for seamless entry', color:'cyan' },
  { icon:'🎤', title:'Artist Directory', desc:'Browse verified Bangladeshi artists with profiles, ratings and direct booking', color:'gold' },
  { icon:'🛒', title:'Merch Store', desc:'Official merchandise marketplace with cart, checkout and order tracking', color:'green' },
  { icon:'📊', title:'Live Dashboards', desc:'Role-specific analytics for audience, artists, organizers and administrators', color:'cyan' },
  { icon:'🔐', title:'Secure Platform', desc:'JWT authentication with role-based access control and data encryption', color:'gold' },
  { icon:'📱', title:'QR Scanner', desc:'Real-time ticket validation with organizer-side QR scanning system', color:'green' },
];

const STATS = [
  { value:'87',  label:'Active Artists',  sub:'+4 on duty today',  color:'cyan'  },
  { value:'142', label:'Total Events',     sub:'+12 new this week', color:'gold'  },
  { value:'218', label:'Tickets Solved',   sub:'92% success rate',  color:'green' },
  { value:'9',   label:'Critical Cases',   sub:'-3 resolved today', color:'red'   },
];

export default function Home() {
  const { user } = useAuth();
  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    api.get('/events?status=live&limit=3')
      .then(res => setLiveEvents(Array.isArray(res.data?.events || res.data) ? (res.data?.events || res.data) : []))
      .catch(() => {});
    api.get('/events?status=approved&limit=6')
      .then(res => setUpcomingEvents(Array.isArray(res.data?.events || res.data) ? (res.data?.events || res.data) : []))
      .catch(() => {});
  }, []);

  const dbEvents = [...liveEvents, ...upcomingEvents].slice(0, 6);

  return (
    <div className="page-wrapper">
      <style>{animStyles}</style>
      <div className="main-content" style={{ maxWidth:'1200px', margin:'0 auto' }}>

        {/* ═══════ HERO WITH IMAGE ═══════ */}
        <section style={{ position:'relative', padding:'48px 0 40px', overflow:'hidden' }}>
          <div className="hero-orb" style={{ width:'500px',height:'500px',top:'-200px',right:'-100px',background:'var(--cyan)' }} />
          <div className="hero-orb" style={{ width:'400px',height:'400px',bottom:'-150px',left:'-100px',background:'#b040ff' }} />
          <div className="hero-line" style={{ top:'32px',left:0,right:0 }} />
          <div className="hero-line" style={{ bottom:0,left:0,right:0,animationDelay:'2s' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            {/* Meta tags */}
            <div className="anim-fade-up" style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px',flexWrap:'wrap' }}>
              <div className="section-tag"><span className="dot" />IIT · University of Dhaka</div>
              <div className="section-tag" style={{ borderColor:'rgba(255,179,0,0.15)' }}>
                <span style={{ width:4,height:4,borderRadius:'50%',background:'var(--gold)',display:'inline-block' }} />
                Software Project Lab II
              </div>
              {liveEvents.length > 0 && (
                <Link to="/concerts?status=live" style={{ textDecoration:'none' }}>
                  <div className="section-tag" style={{ borderColor:'rgba(255,68,68,0.3)',color:'#ff6b6b',cursor:'pointer' }}>
                    <span className="live-dot" />
                    {liveEvents.length} Live Now
                  </div>
                </Link>
              )}
            </div>

            {/* Hero grid: text + image */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',alignItems:'center' }} className="hero-grid">

              {/* Left — Copy */}
              <div>
                <h1 className="anim-slide-left" style={{ fontFamily:'var(--text-display)',fontSize:'52px',fontWeight:900,color:'var(--text-primary)',letterSpacing:'0.06em',lineHeight:1.05,marginBottom:'6px' }}>
                  GAAN<span style={{ color:'var(--cyan)',textShadow:'0 0 30px rgba(0,212,255,0.3)' }}>BAJNA</span>
                </h1>
                <div className="anim-slide-left" style={{ animationDelay:'0.1s', fontFamily:'var(--text-body)',fontSize:'18px',color:'var(--gold)',letterSpacing:'0.04em',fontWeight:600,marginBottom:'20px' }}>
                  গানবাজনা — Where Every Beat Tells a Story
                </div>
                <p className="anim-slide-left" style={{ animationDelay:'0.2s', fontFamily:'var(--text-body)',fontSize:'15px',color:'var(--text-secondary)',lineHeight:1.9,maxWidth:'520px',marginBottom:'32px' }}>
                  Music event platform of the <strong style={{ color:'var(--cyan)' }}>Institute of Information Technology</strong>, University of Dhaka.
                  Connecting Bangladeshi artists, organizers, and audiences through the power of music and technology.
                </p>
                <div className="anim-slide-left" style={{ animationDelay:'0.3s', display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'32px' }}>
                  <Link to="/concerts" className="cta-btn cta-primary">⚡ Browse Concerts</Link>
                  <Link to="/marketplace" className="cta-btn cta-secondary">🛒 Marketplace</Link>
                  {!user && <Link to="/register" className="cta-btn cta-ghost">Join Free →</Link>}
                </div>
                <div className="anim-slide-left" style={{ animationDelay:'0.4s', display:'flex',gap:'28px',flexWrap:'wrap' }}>
                  {[
                    // { num:'87+', label:'Artists' },
                    // { num:'142', label:'Events' },
                    // { num:'4.8★', label:'Rating' },
                  ].map(t => (
                    <div key={t.label}>
                      <div style={{ fontFamily:'Orbitron,monospace',fontSize:'20px',fontWeight:800,color:'var(--text-primary)',letterSpacing:'0.04em' }}>{t.num}</div>
                      <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',letterSpacing:'0.12em',textTransform:'uppercase',marginTop:'2px' }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Hero Image */}
              <div className="anim-slide-right" style={{ animationDelay:'0.15s' }}>
                <div className="hero-image-container" style={{ height:'420px' }}>
                  {/* Corner accents */}
                  <div className="hero-image-corner tl" />
                  <div className="hero-image-corner tr" />
                  <div className="hero-image-corner bl" />
                  <div className="hero-image-corner br" />
                  {/* The local image */}
                  <img src={heroImage} alt="GAANBAJNA — Concert Experience" />
                  {/* Overlay */}
                  <div className="hero-image-overlay" />
                  {/* Info badge overlaid on image */}
                  <div className="hero-image-badge">
                    <div style={{ fontFamily:'var(--text-mono)',fontSize:'9px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)' }}>
                      Institute of Information Technology
                    </div>
                    <div style={{ fontFamily:'Orbitron,monospace',fontSize:'14px',fontWeight:700,color:'var(--cyan)',letterSpacing:'0.08em' }}>
                      UNIVERSITY OF DHAKA
                    </div>
                    <div style={{ display:'flex',gap:'16px',marginTop:'4px',fontFamily:'var(--text-mono)',fontSize:10,color:'var(--text-secondary)' }}>
                      <span></span>
                      <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
                      <span></span>
                      <span style={{ color:'rgba(255,255,255,0.15)' }}>|</span>
                      <span style={{ color:'var(--gold)' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ LIVE STRIP ═══════ */}
        {liveEvents.length > 0 && (
          <section className="anim-fade-up" style={{ marginBottom:'48px' }}>
            <div style={{ background:'rgba(255,68,68,0.04)',border:'1px solid rgba(255,68,68,0.2)',borderRadius:'14px',padding:'14px 24px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap' }}>
              <div style={{ background:'rgba(255,68,68,0.1)',padding:'6px 14px',borderRadius:'8px',display:'flex',alignItems:'center',gap:'8px',flexShrink:0 }}>
                <span className="live-dot" />
                <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'#ff6b6b',fontWeight:800,letterSpacing:'0.1em' }}>LIVE NOW</span>
              </div>
              <div style={{ display:'flex',gap:'8px',flexWrap:'wrap',flex:1 }}>
                {liveEvents.map(ev => (
                  <Link key={ev.id} to={`/concerts/${ev.custom_url || ev.id}`} style={{ textDecoration:'none' }}>
                    <span style={{ fontFamily:'var(--text-body)',fontSize:'12px',color:'var(--text-secondary)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'5px 14px',transition:'all 0.2s',display:'inline-flex',alignItems:'center',gap:'6px' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,68,68,0.3)';e.currentTarget.style.color='#ff6b6b'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.color='var(--text-secondary)'}}>
                      🎵 {ev.title}
                    </span>
                  </Link>
                ))}
              </div>
              <Link to="/concerts?status=live" style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'#ff6b6b',textDecoration:'none',letterSpacing:'0.08em',flexShrink:0 }}>
                VIEW ALL →
              </Link>
            </div>
          </section>
        )}

        {/* ═══════ DB CONCERTS ═══════ */}
        {dbEvents.length > 0 && (
          <section style={{ marginBottom:'56px' }}>
            <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'12px' }}>
              <div>
                <div className="section-tag" style={{ marginBottom:'12px' }}><span className="dot" />Events</div>
                <h2 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'var(--text-primary)',letterSpacing:'0.04em' }}>
                  {liveEvents.length > 0 ? 'Live & Upcoming' : 'Upcoming Concerts'}
                </h2>
              </div>
              <Link to="/concerts" className="cta-btn cta-ghost" style={{ padding:'8px 18px',fontSize:'11px' }}>View All →</Link>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'18px' }}>
              {dbEvents.map((ev, i) => {
                const badge = STATUS_BADGE[ev.status] || STATUS_BADGE.approved;
                const isLive = ev.status === 'live';
                return (
                  <Link key={ev.id} to={`/concerts/${ev.custom_url || ev.id}`} style={{ textDecoration:'none' }}>
                    <div className={`concert-card anim-fade-up ${isLive ? 'live-card' : ''}`} style={{ animationDelay:`${i * 0.08}s` }}>
                      <div style={{ height:'150px',position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#080f1e,#0f1e35)' }}>
                        {ev.banner_image
                          ? <img src={ev.banner_image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                          : <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:'56px',opacity:0.6 }}>🎵</div>
                        }
                        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,15,30,0.9) 0%,transparent 50%)' }} />
                        <div style={{ position:'absolute',top:'12px',right:'12px',display:'flex',alignItems:'center',gap:'6px' }}>
                          {isLive && <span className="live-dot" />}
                          <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        </div>
                        {isLive && (
                          <div style={{ position:'absolute',bottom:'12px',left:'12px',fontFamily:'var(--text-mono)',fontSize:'9px',color:'#ff6b6b',letterSpacing:'0.12em',background:'rgba(255,68,68,0.15)',padding:'3px 10px',borderRadius:'4px' }}>
                            ● STREAMING
                          </div>
                        )}
                      </div>
                      <div style={{ padding:'18px' }}>
                        <div style={{ fontFamily:'var(--text-display)',fontSize:'14px',color:'var(--text-primary)',letterSpacing:'0.03em',marginBottom:'10px',lineHeight:1.4 }}>{ev.title}</div>
                        <div style={{ display:'flex',flexDirection:'column',gap:'5px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-secondary)',marginBottom:'14px' }}>
                          <span>📍 {ev.venue || '—'}</span>
                          <span>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</span>
                          {ev.singer_name && <span>🎤 {ev.singer_name}</span>}
                        </div>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <span className="badge badge-gold">
                            {ev.tier1_price === 0 ? 'FREE' : ev.tier1_price ? `from ৳${ev.tier1_price}` : 'See Details'}
                          </span>
                          <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:isLive ? '#ff6b6b' : 'var(--cyan)',letterSpacing:'0.06em',fontWeight:600 }}>
                            {isLive ? 'JOIN LIVE →' : 'DETAILS →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════ FEATURED CONCERTS ═══════ */}
        <section style={{ marginBottom:'56px' }}>
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'12px' }}>
            <div>
              <div className="section-tag" style={{ marginBottom:'12px' }}><span className="dot" />Featured</div>
              <h2 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'var(--text-primary)',letterSpacing:'0.04em' }}>Highlighted Events</h2>
            </div>
            <Link to="/concerts" className="cta-btn cta-ghost" style={{ padding:'8px 18px',fontSize:'11px' }}>View All →</Link>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'18px' }}>
            {FEATURED_CONCERTS.map((ev, i) => (
              <Link key={ev.id} to="/concerts" style={{ textDecoration:'none' }}>
                <div className="concert-card anim-fade-up" style={{ animationDelay:`${i * 0.06}s` }}>
                  <div style={{ height:'110px',position:'relative',overflow:'hidden',background:ev.featured?'linear-gradient(135deg,#071a2e,#0e2540)':'linear-gradient(135deg,#080f1e,#0f1e35)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <span style={{ fontSize:'48px',opacity:0.7 }}>{ev.emoji}</span>
                    <div style={{ position:'absolute',top:'10px',right:'10px',display:'flex',gap:6 }}>
                      <span className={`badge badge-${ev.tagColor}`}>{ev.tag}</span>
                      {ev.featured && <span className="badge badge-cyan">★</span>}
                    </div>
                    {ev.featured && <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,var(--cyan),var(--gold))' }} />}
                  </div>
                  <div style={{ padding:'18px' }}>
                    <div style={{ fontFamily:'var(--text-display)',fontSize:'13px',color:ev.featured?'var(--cyan)':'var(--text-primary)',letterSpacing:'0.03em',marginBottom:'3px',lineHeight:1.4 }}>{ev.title}</div>
                    <div style={{ fontFamily:'var(--text-mono)',fontSize:'9px',color:'var(--text-dim)',marginBottom:'10px',letterSpacing:'0.04em' }}>{ev.subtitle}</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:'4px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-secondary)',marginBottom:'12px' }}>
                      <span>📍 {ev.venue}</span>
                      <span>📅 {new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
                      <span>🎤 {ev.singer_name} · {ev.genre}</span>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <span className="badge badge-gold">{ev.price}</span>
                      <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:ev.featured?'var(--cyan)':'var(--text-secondary)',letterSpacing:'0.06em' }}>DETAILS →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══════ FEATURES ═══════ */}
        <section style={{ marginBottom:'56px' }}>
          <div style={{ textAlign:'center',marginBottom:'32px' }}>
            <div className="section-tag" style={{ margin:'0 auto 12px',width:'fit-content' }}><span className="dot" />Platform</div>
            <h2 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'var(--text-primary)',letterSpacing:'0.04em',marginBottom:'8px' }}>Built for the Modern Concert Experience</h2>
            <p style={{ fontFamily:'var(--text-body)',fontSize:'14px',color:'var(--text-dim)',maxWidth:'500px',margin:'0 auto',lineHeight:1.6 }}>
              End-to-end event management — from ticket purchase to venue entry, all in one platform.
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-item anim-fade-up" style={{ animationDelay:`${i * 0.08}s` }}>
                <div className="feature-icon-box" style={{ background:`rgba(0,212,255,0.06)`,border:'1px solid rgba(0,212,255,0.12)' }}>
                  {f.icon}
                </div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'12px',letterSpacing:'0.1em',color:`var(--${f.color})`,marginBottom:'8px',fontWeight:700 }}>
                  {f.title.toUpperCase()}
                </div>
                <div style={{ fontFamily:'var(--text-body)',fontSize:'13px',color:'var(--text-secondary)',lineHeight:1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ TEAM ═══════ */}
        <section style={{ marginBottom:'56px' }}>
          <div style={{ textAlign:'center',marginBottom:'32px' }}>
            <div className="section-tag" style={{ margin:'0 auto 12px',width:'fit-content' }}><span className="dot" />Team</div>
            <h2 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'var(--text-primary)',letterSpacing:'0.04em',marginBottom:'6px' }}>Meet the Developers</h2>
            <p style={{ fontFamily:'var(--text-body)',fontSize:'13px',color:'var(--text-dim)' }}>
              Team <span style={{ fontFamily:'Orbitron,monospace',color:'var(--cyan)',letterSpacing:'0.08em',fontWeight:700 }}>CLEMENTINE</span> — IIT, University of Dhaka
            </p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',maxWidth:'560px',margin:'0 auto' }}>
            <div className="glass-card anim-fade-up" style={{ animationDelay:'0.1s',borderRadius:'20px',padding:'28px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px' }}>
              <div style={{ position:'relative',display:'inline-block' }}>
                <div className="photo-ring photo-ring-zarin" />
                <img src={zarinPhoto} alt="Kazi Zarin Tasnim" style={{ width:'120px',height:'120px',borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(192,57,43,0.6)',display:'block',position:'relative',zIndex:1 }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="team-name-zarin">Kazi Zarin Tasnim</div>
                <div style={{ fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'#ff6b6b',background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.2)',padding:'2px 10px',borderRadius:'4px',display:'inline-block',marginTop:'6px' }}>
                  Developer
                </div>
              </div>
            </div>
            <div className="glass-card anim-fade-up" style={{ animationDelay:'0.25s',borderRadius:'20px',padding:'28px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px' }}>
              <div style={{ position:'relative',display:'inline-block' }}>
                <div className="photo-ring photo-ring-nafish" />
                <img src={nafishPhoto} alt="Nafish Salehin" style={{ width:'120px',height:'120px',borderRadius:'50%',objectFit:'cover',border:'3px solid rgba(26,108,168,0.6)',display:'block',position:'relative',zIndex:1 }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="team-name-nafish">Nafish Salehin</div>
                <div style={{ fontFamily:'Share Tech Mono,monospace',fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:'#4fc3f7',background:'rgba(79,195,247,0.08)',border:'1px solid rgba(79,195,247,0.2)',padding:'2px 10px',borderRadius:'4px',display:'inline-block',marginTop:'6px' }}>
                  Developer
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ STATISTICS ═══════ */}
        <section style={{ marginBottom:'40px' }}>
          <div style={{ textAlign:'center',marginBottom:'28px' }}>
            <div className="section-tag" style={{ margin:'0 auto 12px',width:'fit-content' }}><span className="dot" />Metrics</div>
            <h2 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'var(--text-primary)',letterSpacing:'0.04em' }}>Platform at a Glance</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px' }}>
            {STATS.map((s, i) => (
              <div key={s.label} className="stat-block anim-fade-up" style={{ animationDelay:`${i * 0.1}s` }}>
                <div className="stat-number" style={{ color:`var(--${s.color})`,animationDelay:`${i * 0.1 + 0.3}s` }}>{s.value}</div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-secondary)',marginTop:'8px',marginBottom:'6px' }}>{s.label}</div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:10,color:'var(--text-dim)',letterSpacing:'0.05em' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign:'center',padding:'24px 0 8px',borderTop:'1px solid var(--border-dim)' }}>
          <p style={{ fontFamily:'var(--text-mono)',fontSize:10,color:'var(--text-dim)',letterSpacing:'0.1em' }}>
            © 2025 GAANBAJNA · IIT, UNIVERSITY OF DHAKA · TEAM CLEMENTINE
          </p>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child { order: -1; }
          .hero-image-container { height: 260px !important; }
        }
        @media (max-width: 768px) {
          h1 { font-size: 36px !important; }
          .stat-number { font-size: 28px !important; }
          [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .hero-grid { gap: 20px !important; }
          .hero-image-container { height: 200px !important; }
        }
      `}</style>
    </div>
  );
}
