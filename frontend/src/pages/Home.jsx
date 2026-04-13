import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import zarinPhoto from '../assets/zarin.jpg';
import nafishPhoto from '../assets/nafish.jpg';

const nameAnimStyles = `
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
  @keyframes spin { to { transform: rotate(360deg); } }
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
`;

const DEFAULT_CONCERTS = [
  { id:'default-1', title:'IIT-DU Tech Fest 2025 — Mega Night', subtitle:'Annual Tech Fest Concert — Grand Finale', venue:'টিএসসি চত্বর, ঢাকা বিশ্ববিদ্যালয়', venue_en:'TSC Ground, University of Dhaka', event_date:'2026-12-20', singer_name:'Aurthohin', genre:'Rock / Metal', price:'৳200', tag:'IIT-DU', tag_color:'badge-cyan', emoji:'⚡', highlight:true },
  { id:'default-2', title:'University of Dhaka 104th Founding Day', subtitle:'১০৪তম প্রতিষ্ঠাবার্ষিকী সাংস্কৃতিক সন্ধ্যা', venue:'বটমূল, ঢাকা বিশ্ববিদ্যালয়', venue_en:'Botomul Ground, University of Dhaka', event_date:'2026-07-01', singer_name:'Shironamhin', genre:'Classical / Cultural', price:'৳150', tag:'DU', tag_color:'badge-gold', emoji:'🏛️', highlight:false },
  { id:'default-3', title:'পহেলা বৈশাখ ১৪৩৩ — TSC Grand Festival', subtitle:'Pohela Boishakh — Bengali New Year 1433', venue:'টিএসসি চত্বর, ঢাকা বিশ্ববিদ্যালয়', venue_en:'TSC Cafeteria Ground, University of Dhaka', event_date:'2026-04-14', singer_name:'Hawa Band', genre:'Folk / Baul / Cultural', price:'Free', tag:'CULTURAL', tag_color:'badge-gold', emoji:'🎊', highlight:false },
  { id:'default-4', title:'Victory Day Rock Concert — বিজয় উৎসব', subtitle:'৫৫তম মহান বিজয় দিবস কনসার্ট', venue:'কেন্দ্রীয় শহীদ মিনার, ঢাকা বিশ্ববিদ্যালয়', venue_en:'Central Shaheed Minar, DU', event_date:'2026-12-16', singer_name:'Cryptic Fate & Shironamhin', genre:'Rock / Patriotic', price:'৳150', tag:'SPECIAL', tag_color:'badge-red', emoji:'🇧🇩', highlight:false },
  { id:'default-5', title:'Ekushey February — Language Martyrs Night', subtitle:'আন্তর্জাতিক মাতৃভাষা দিবস রাত্রি কনসার্ট', venue:'কেন্দ্রীয় শহীদ মিনার, ঢাবি', venue_en:'Central Shaheed Minar, DU', event_date:'2027-02-21', singer_name:'Shironamhin', genre:'Cultural / Memorial', price:'Free', tag:'EKUSHEY', tag_color:'badge-red', emoji:'🕊️', highlight:false },
  { id:'default-6', title:'Aurthohin 25th Anniversary at DU', subtitle:'রজতজয়ন্তী — 25 Years of Bangladeshi Rock', venue:'টিএসসি মাঠ, ঢাকা বিশ্ববিদ্যালয়', venue_en:'TSC Ground, University of Dhaka', event_date:'2026-12-31', singer_name:'Aurthohin', genre:'Rock / Classic', price:'৳250', tag:'LEGEND', tag_color:'badge-purple', emoji:'🎸', highlight:true },
];

const STATS = [
  { label:'Active Artists',    value:'87',  trend:'↑ 4 on duty today',   color:'cyan',  icon:'🎤' },
  { label:'Open Events',       value:'142', trend:'↑ 12 new this week',  color:'gold',  icon:'🎫' },
  { label:'Solved This Month', value:'218', trend:'↑ 92% success rate',  color:'green', icon:'✓'  },
  { label:'Critical Cases',    value:'9',   trend:'↓ 3 resolved today',  color:'red',   icon:'⚠'  },
];

export default function Home() {
  const { user } = useAuth();
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    api.get('/events?limit=6')
      .then(res => {
        const data = res.data?.events || res.data || [];
        setLiveEvents(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-wrapper">
      <style>{nameAnimStyles}</style>
      <div className="main-content">

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom:'28px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className={`stat-card ${s.color} fade-in`} style={{ animationDelay:`${i*0.05}s` }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-trend">{s.trend}</div>
              </div>
              <div className="stat-icon">{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Hero Banner */}
        <div style={{ background:'linear-gradient(135deg,#040d1a 0%,#071628 50%,#040d1a 100%)', border:'1px solid rgba(0,212,255,0.25)', borderLeft:'4px solid var(--cyan)', borderRadius:'var(--radius-lg)', padding:'36px 40px', marginBottom:'28px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute',top:'-60px',right:'-60px',width:'300px',height:'300px',borderRadius:'50%',background:'radial-gradient(circle,rgba(0,212,255,0.08) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div style={{ position:'absolute',bottom:'-80px',left:'20%',width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(176,64,255,0.05) 0%,transparent 70%)',pointerEvents:'none' }} />
          <div style={{ display:'flex',alignItems:'center',gap:'32px',flexWrap:'wrap',position:'relative',zIndex:1 }}>
            <div style={{ flex:1, minWidth:'280px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px' }}>
                <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',padding:'4px 10px',background:'var(--cyan-dim)',border:'1px solid rgba(0,212,255,0.4)',borderRadius:'3px',color:'var(--cyan)' }}>● IIT — DU FLAGSHIP</span>
                <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.15em',padding:'4px 10px',background:'rgba(255,179,0,0.1)',border:'1px solid rgba(255,179,0,0.3)',borderRadius:'3px',color:'var(--gold)' }}>University of Dhaka</span>
              </div>
              <h1 style={{ fontFamily:'var(--text-display)',fontSize:'36px',fontWeight:900,color:'var(--cyan)',letterSpacing:'0.08em',textShadow:'var(--cyan-glow)',lineHeight:1.1,marginBottom:'8px' }}>GAANBAJNA</h1>
              <div style={{ fontFamily:'var(--text-body)',fontSize:'16px',color:'var(--gold)',letterSpacing:'0.05em',marginBottom:'14px',fontWeight:600 }}>গানবাজনা — Where Every Beat Tells a Story</div>
              <p style={{ fontFamily:'var(--text-body)',fontSize:'14px',color:'var(--text-secondary)',lineHeight:1.8,maxWidth:'520px',marginBottom:'24px' }}>
                The official music event platform of <strong style={{ color:'var(--cyan)' }}>Institute of Information Technology (IIT)</strong>, University of Dhaka. Connecting Bangladeshi artists, organizers, and audiences through the power of music and technology.
              </p>
              <div style={{ display:'flex',gap:'12px',flexWrap:'wrap' }}>
                <Link to="/concerts" className="btn btn-solid-cyan btn-lg">⚡ BROWSE CONCERTS</Link>
                <Link to="/marketplace" className="btn btn-gold btn-lg">🛒 MARKETPLACE</Link>
                {!user && <Link to="/register" className="btn btn-ghost btn-lg">JOIN NOW</Link>}
              </div>
            </div>
            <div style={{ background:'rgba(0,212,255,0.05)',border:'1px solid rgba(0,212,255,0.2)',borderRadius:'var(--radius-lg)',padding:'24px',minWidth:'220px' }}>
              <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'14px' }}>IIT — DU At a Glance</div>
              {[{ label:'Department',value:'IIT, DU' },{ label:'Location',value:'Nilkhet, Dhaka' },{ label:'Target',value:'4.00' },{ label:'Program',value:'Software Project Lab II' },{ label:'Supervisor',value:'Dr. Naushin Nower' }].map(row => (
                <div key={row.label} style={{ display:'flex',justifyContent:'space-between',gap:'12px',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontFamily:'var(--text-mono)',fontSize:'11px' }}>
                  <span style={{ color:'var(--text-dim)',letterSpacing:'0.08em' }}>{row.label}</span>
                  <span style={{ color:'var(--cyan)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live DB Concerts */}
        {liveEvents.length > 0 && (
          <>
            <div style={{ marginBottom:'10px' }} className="flex-between">
              <div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'4px' }}>ঢাকা বিশ্ববিদ্যালয় · IIT-DU · TSC · শহীদ মিনার</div>
                <h2 style={{ fontFamily:'var(--text-display)',fontSize:'18px',color:'var(--text-primary)',letterSpacing:'0.05em' }}>UPCOMING CONCERTS</h2>
              </div>
              <Link to="/concerts" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px',marginBottom:'40px' }}>
              {liveEvents.map(ev => (
                <Link key={ev.id} to={`/concerts/${ev.custom_url || ev.id}`} style={{ textDecoration:'none' }}>
                  <div className="event-card" onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,212,255,0.12)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}} style={{ transition:'all 0.2s', height:'100%' }}>
                    <div style={{ height:'140px',overflow:'hidden',position:'relative',background:'linear-gradient(135deg,#080f1e 0%,#0f1e35 100%)' }}>
                      {ev.banner_image
                        ? <img src={ev.banner_image} alt={ev.title} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                        : <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:'48px' }}>🎵</div>
                      }
                      <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,15,30,0.85) 0%,transparent 60%)' }} />
                      <div style={{ position:'absolute',top:'10px',right:'10px' }}>
                        <span className="badge badge-green">UPCOMING</span>
                      </div>
                    </div>
                    <div className="event-card-body">
                      <div className="event-card-title">{ev.title}</div>
                      <div className="event-card-meta">
                        <span>📍 {ev.venue || '—'}</span>
                        <span>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</span>
                        {ev.singer_name && <span>🎤 {ev.singer_name}</span>}
                      </div>
                      <div className="flex-between">
                        <span className="badge badge-gold">
                          {ev.tier1_price === 0 ? 'FREE' : ev.tier1_price ? `৳${ev.tier1_price}` : 'See Details'}
                        </span>
                        <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--cyan)' }}>VIEW →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Static featured concerts */}
        <div style={{ marginBottom:'10px' }} className="flex-between">
          <div>
            <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'4px' }}>Highlighted Events</div>
            <h2 style={{ fontFamily:'var(--text-display)',fontSize:'18px',color:'var(--text-primary)',letterSpacing:'0.05em' }}>FEATURED CONCERTS</h2>
          </div>
          <Link to="/concerts" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px',marginBottom:'40px' }}>
          {DEFAULT_CONCERTS.map((ev, i) => (
            <Link key={ev.id} to="/concerts" style={{ textDecoration:'none' }}>
              <div style={{ background:ev.highlight?'linear-gradient(135deg,#071628 0%,#0b1e36 100%)':'var(--bg-card)', border:ev.highlight?'1px solid rgba(0,212,255,0.35)':'var(--border-dim)', borderTop:ev.highlight?'3px solid var(--cyan)':'3px solid rgba(255,179,0,0.3)', borderRadius:'var(--radius-lg)', overflow:'hidden', transition:'transform 0.2s,box-shadow 0.2s', animation:`fadeInUp 0.4s ease ${i*0.07}s both`, cursor:'pointer', height:'100%' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=ev.highlight?'0 12px 40px rgba(0,212,255,0.15)':'0 12px 40px rgba(0,0,0,0.4)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                <div style={{ height:'120px',background:ev.highlight?'linear-gradient(135deg,#071a2e 0%,#0e2540 100%)':'linear-gradient(135deg,#080f1e 0%,#0f1e35 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'52px',position:'relative' }}>
                  {ev.emoji}
                  <div style={{ position:'absolute',top:'10px',right:'10px',display:'flex',gap:'6px' }}>
                    <span className={`badge ${ev.tag_color}`}>{ev.tag}</span>
                    {ev.highlight && <span className="badge badge-cyan" style={{ animation:'pulse 2s infinite' }}>★ FEATURED</span>}
                  </div>
                </div>
                <div style={{ padding:'16px' }}>
                  <div style={{ fontFamily:'var(--text-display)',fontSize:'14px',color:ev.highlight?'var(--cyan)':'var(--text-primary)',letterSpacing:'0.04em',marginBottom:'4px',textShadow:ev.highlight?'var(--cyan-glow)':'none' }}>{ev.title}</div>
                  <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',marginBottom:'10px',letterSpacing:'0.05em' }}>{ev.subtitle}</div>
                  <div style={{ display:'flex',flexDirection:'column',gap:'4px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-secondary)',marginBottom:'12px' }}>
                    <span>📍 {ev.venue}</span>
                    <span style={{ fontSize:'10px',color:'var(--text-dim)',paddingLeft:'18px' }}>{ev.venue_en}</span>
                    <span>📅 {new Date(ev.event_date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</span>
                    <span>🎤 {ev.singer_name}</span>
                    <span>🎵 {ev.genre}</span>
                  </div>
                  <div className="flex-between">
                    <span className="badge badge-gold">{ev.price}</span>
                    <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:ev.highlight?'var(--cyan)':'var(--text-secondary)',letterSpacing:'0.05em' }}>DETAILS →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Platform Features */}
        <div style={{ marginBottom:'40px' }}>
          <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'4px' }}>System Capabilities</div>
          <h2 style={{ fontFamily:'var(--text-display)',fontSize:'18px',color:'var(--text-primary)',letterSpacing:'0.05em',marginBottom:'20px' }}>PLATFORM FEATURES</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px' }}>
            {[
              { icon:'🎫',title:'TICKET MANAGEMENT', desc:'Buy tickets online and receive QR codes via email for seamless venue entry',color:'cyan' },
              { icon:'🎤',title:'ARTIST BOOKING',    desc:'Organizers can browse and directly book verified Bangladeshi singers for events',color:'gold' },
              { icon:'🛒',title:'MERCHANDISE STORE', desc:'Artists and organizers can list and sell merchandise with smart cart system',color:'green' },
              { icon:'📊',title:'LIVE DASHBOARDS',   desc:'Role-specific dashboards for audience, artists, organizers and admins',color:'cyan' },
              { icon:'🔐',title:'SECURE AUTH',        desc:'JWT-based authentication with email OTP verification for all users',color:'gold' },
              { icon:'📱',title:'QR SCANNER',         desc:'Real-time QR code scanning for organizers to validate event entry tickets',color:'green' },
            ].map(f => (
              <div key={f.title} style={{ background:'var(--bg-card)',border:'var(--border-dim)',borderLeft:`2px solid var(--${f.color})`,borderRadius:'var(--radius-lg)',padding:'20px',transition:'transform 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{ fontSize:'24px',marginBottom:'10px' }}>{f.icon}</div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'11px',letterSpacing:'0.1em',color:`var(--${f.color})`,marginBottom:'8px' }}>{f.title}</div>
                <div style={{ fontFamily:'var(--text-body)',fontSize:'13px',color:'var(--text-secondary)',lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Banner */}
        <div className="team-banner" style={{ padding:'28px 24px', marginTop:'20px' }}>
          <div className="team-label">
            <span className="team-label-small">Developed by Team</span>
            <div className="team-label-name">CLEMENTINE</div>
          </div>
          <div style={{ width:'1px',height:'60px',background:'rgba(255,255,255,0.1)' }} />
          <div className="team-members" style={{ gap:'32px' }}>
            <div className="team-chip-animated">
              <div className="photo-wrapper">
                <div className="photo-ring-zarin" />
                <img src={zarinPhoto} alt="Kazi Zarin Tasnim" style={{ width:'160px',height:'160px',borderRadius:'50%',objectFit:'cover',border:'4px solid #c0392b',display:'block',position:'relative',zIndex:1 }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="team-name-zarin">Kazi Zarin Tasnim</div>
                <div className="role-tag" style={{ color:'#ff6b6b',background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)' }}>Developer</div>
              </div>
            </div>
            <div className="team-chip-animated">
              <div className="photo-wrapper">
                <div className="photo-ring-nafish" />
                <img src={nafishPhoto} alt="Nafish Salehin" style={{ width:'160px',height:'160px',borderRadius:'50%',objectFit:'cover',border:'4px solid #1a6ca8',display:'block',position:'relative',zIndex:1 }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <div className="team-name-nafish">Nafish Salehin</div>
                <div className="role-tag" style={{ color:'#4fc3f7',background:'rgba(79,195,247,0.1)',border:'1px solid rgba(79,195,247,0.3)' }}>Developer</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
