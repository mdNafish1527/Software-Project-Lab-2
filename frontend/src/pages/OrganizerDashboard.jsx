import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const getTierLabel = (n) => {
  if (n === 1) return 'Standing';
  if (n === 2) return 'Chair';
  if (n === 3) return 'Sofa';
  return `Tier ${n}`;
};

const STATUS_COLOR = {
  pending:   '#D4A853',
  approved:  '#00BFA6',
  live:      '#ff4444',
  ended:     '#888',
  cancelled: '#FF5252',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Ticket Sales Modal ───────────────────────────────────────────────────────
function TicketSalesModal({ eventId, eventTitle, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${eventId}/ticket-sales`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)',border:'1px solid rgba(212,168,83,0.25)',borderRadius:'var(--radius-lg)',maxWidth:'700px',width:'100%',maxHeight:'85vh',overflowY:'auto',padding:'28px' }} onClick={e=>e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom:'20px' }}>
          <div>
            <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',letterSpacing:'0.15em',marginBottom:'4px' }}>TICKET SALES REPORT</div>
            <h3 style={{ fontFamily:'var(--text-display)',fontSize:'16px',color:'var(--gold)' }}>{eventTitle}</h3>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'6px',color:'var(--text-secondary)',cursor:'pointer',padding:'6px 10px' }}>✕</button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding:'40px' }}><div className="spinner" /></div>
        ) : !data ? (
          <div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No sales data yet</div></div>
        ) : (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px' }}>
              {[
                { label:'Total Sold',    value:data.totalSold,                                   icon:'🎟️', color:'var(--cyan)' },
                { label:'Total Revenue', value:`৳${Number(data.totalRevenue).toLocaleString()}`, icon:'💰', color:'var(--gold)' },
                { label:'Sections',      value:data.tiers.length,                                icon:'🏷️', color:'#b040ff'    },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--bg-secondary)',border:'var(--border-dim)',borderRadius:'var(--radius-sm)',padding:'14px',textAlign:'center' }}>
                  <div style={{ fontSize:'22px',marginBottom:'4px' }}>{s.icon}</div>
                  <div style={{ fontFamily:'var(--text-display)',fontSize:'18px',color:s.color,fontWeight:'700' }}>{s.value}</div>
                  <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',marginTop:'2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {data.tiers.map(t => {
              const pct   = t.capacity > 0 ? Math.round((t.sold / t.capacity) * 100) : 0;
              const color = t.tier===1 ? 'var(--gold)' : t.tier===2 ? 'var(--cyan)' : '#b040ff';
              return (
                <div key={t.tier} style={{ background:'var(--bg-secondary)',border:'var(--border-dim)',borderRadius:'var(--radius-sm)',padding:'14px',marginBottom:'10px' }}>
                  <div className="flex-between" style={{ marginBottom:'8px' }}>
                    <div style={{ display:'flex',gap:'10px',alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--text-display)',fontSize:'13px',color }}>{getTierLabel(t.tier)}</span>
                      <span style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)' }}>৳{t.price} × {t.sold}</span>
                    </div>
                    <div style={{ display:'flex',gap:'16px' }}>
                      <span style={{ fontFamily:'var(--text-mono)',fontSize:'12px',color:'var(--text-secondary)' }}>{t.sold}/{t.capacity}</span>
                      <span style={{ fontFamily:'var(--text-display)',fontSize:'13px',color:'var(--gold)' }}>৳{t.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ height:'6px',background:'rgba(255,255,255,0.07)',borderRadius:'3px',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:'3px',transition:'width 0.8s' }} />
                  </div>
                  <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',marginTop:'4px' }}>{pct}% sold · {t.remaining} remaining</div>
                </div>
              );
            })}

            {data.recentPurchases?.length > 0 && (
              <>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',letterSpacing:'0.15em',margin:'16px 0 12px' }}>RECENT PURCHASES</div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Buyer</th><th>Section</th><th>Price</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.recentPurchases.map(p => (
                        <tr key={p.ticket_id}>
                          <td style={{ fontFamily:'var(--text-mono)',fontSize:'12px' }}>{p.buyer}</td>
                          <td><span style={{ color:p.tier===1?'var(--gold)':p.tier===2?'var(--cyan)':'#b040ff',fontFamily:'var(--text-mono)',fontSize:'12px' }}>{getTierLabel(p.tier)}</span></td>
                          <td style={{ color:'var(--gold)',fontFamily:'var(--text-display)',fontSize:'13px' }}>৳{Number(p.price).toLocaleString()}</td>
                          <td style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)' }}>{formatDate(p.purchased_at)}</td>
                          <td><span className={`badge ${p.used ? 'badge-gold' : 'badge-green'}`}>{p.used ? 'USED' : 'VALID'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Edit Ticket Prices Modal ─────────────────────────────────────────────────
function EditPricesModal({ event, onClose, onSaved }) {
  const id = event.event_id || event.id;
  const [form, setForm] = useState({
    tier1_price: event.tier1_price||'', tier1_quantity: event.tier1_quantity||'',
    tier2_price: event.tier2_price||'', tier2_quantity: event.tier2_quantity||'',
    tier3_price: event.tier3_price||'', tier3_quantity: event.tier3_quantity||'',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await api.put(`/events/${id}/ticket-prices`, {
        tier1_price:    Number(form.tier1_price)    || 0,
        tier1_quantity: Number(form.tier1_quantity) || 0,
        tier2_price:    Number(form.tier2_price)    || 0,
        tier2_quantity: Number(form.tier2_quantity) || 0,
        tier3_price:    Number(form.tier3_price)    || 0,
        tier3_quantity: Number(form.tier3_quantity) || 0,
      });
      onSaved(); onClose();
    } catch(e) { setErr(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)',border:'1px solid rgba(0,212,255,0.2)',borderRadius:'var(--radius-lg)',maxWidth:'500px',width:'100%',padding:'28px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--cyan)',letterSpacing:'0.15em',marginBottom:'6px' }}>EDIT TICKET PRICES</div>
        <div style={{ fontFamily:'var(--text-display)',fontSize:'14px',color:'var(--text-primary)',marginBottom:'20px' }}>{event.title}</div>
        {err && <div className="alert alert-error" style={{ marginBottom:'14px' }}>{err}</div>}
        {[
          { n:1, color:'var(--gold)' },
          { n:2, color:'var(--cyan)' },
          { n:3, color:'#b040ff'    },
        ].map(({ n, color }) => (
          <div key={n} style={{ background:'var(--bg-secondary)',border:'var(--border-dim)',borderRadius:'var(--radius-sm)',padding:'14px',marginBottom:'12px' }}>
            <div style={{ fontFamily:'var(--text-display)',fontSize:'12px',color,marginBottom:'10px' }}>{getTierLabel(n).toUpperCase()}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Price (৳)</label>
                <input className="form-control" type="number" min="0"
                  value={form[`tier${n}_price`]}
                  onChange={e => setForm(p => ({ ...p, [`tier${n}_price`]: e.target.value }))} />
              </div>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Capacity</label>
                <input className="form-control" type="number" min="0"
                  value={form[`tier${n}_quantity`]}
                  onChange={e => setForm(p => ({ ...p, [`tier${n}_quantity`]: e.target.value }))} />
              </div>
            </div>
          </div>
        ))}
        <div style={{ display:'flex',gap:'10px',marginTop:'8px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Book Artist Modal ────────────────────────────────────────────────────────
function BookArtistModal({ singers, onClose, onSuccess }) {
  const [form, setForm]             = useState({ singer_id:'', event_date:'', venue:'', proposed_fee:'', message:'' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState('');
  const selected = singers.find(s => String(s.u_id) === String(form.singer_id));

  const handleSubmit = async () => {
    if (!form.singer_id || !form.event_date || !form.venue) { setErr('Artist, date and venue are required'); return; }
    setSubmitting(true); setErr('');
    try {
      await api.post('/events/booking', {
        singer_id:    Number(form.singer_id),
        event_date:   form.event_date,
        venue:        form.venue,
        proposed_fee: Number(form.proposed_fee) || 0,
        message:      form.message,
      });
      onSuccess(); onClose();
    } catch(e) { setErr(e.response?.data?.message || 'Failed to send request'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)',border:'1px solid rgba(0,212,255,0.2)',borderRadius:'var(--radius-lg)',maxWidth:'520px',width:'100%',padding:'28px',maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--cyan)',letterSpacing:'0.15em',marginBottom:'20px' }}>🎤 SEND BOOKING REQUEST</div>
        {err && <div className="alert alert-error" style={{ marginBottom:'14px' }}>{err}</div>}

        <div className="form-group">
          <label className="form-label">Select Artist *</label>
          <select className="form-control" value={form.singer_id} onChange={e => setForm(p => ({ ...p, singer_id: e.target.value }))}>
            <option value="">— Choose an artist —</option>
            {singers.map(s => (
              <option key={s.u_id} value={s.u_id}>
                {s.unique_username}{s.genre ? ` · ${s.genre}` : ''}{s.fixed_fee ? ` · ৳${Number(s.fixed_fee).toLocaleString()}/show` : ''}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div style={{ background:'var(--bg-secondary)',border:'1px solid rgba(212,168,83,0.2)',borderRadius:'var(--radius-sm)',padding:'12px 14px',marginBottom:'16px',display:'flex',gap:'12px',alignItems:'center' }}>
            <div style={{ width:'44px',height:'44px',borderRadius:'50%',background:'rgba(212,168,83,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',fontSize:'18px',fontFamily:'var(--text-display)',flexShrink:0 }}>
              {selected.unique_username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:'var(--text-display)',fontSize:'14px',color:'var(--gold)' }}>{selected.unique_username}</div>
              <div style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)',marginTop:'2px' }}>
                {selected.genre || 'Artist'} {selected.fixed_fee > 0 ? `· ৳${Number(selected.fixed_fee).toLocaleString()}/show` : '· Fee negotiable'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex',flexDirection:'column',gap:'14px' }}>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Proposed Event Date *</label>
            <input className="form-control" type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Venue *</label>
            <input className="form-control" placeholder="e.g. TSC Auditorium, University of Dhaka"
              value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Proposed Fee (৳)</label>
            <input className="form-control" type="number" placeholder="e.g. 50000"
              value={form.proposed_fee} onChange={e => setForm(p => ({ ...p, proposed_fee: e.target.value }))} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Message to Artist</label>
            <textarea className="form-control" rows={3} placeholder="Describe your event, audience size, requirements..."
              value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ resize:'vertical' }} />
          </div>
        </div>

        <div style={{ marginTop:'16px',background:'rgba(0,191,166,0.06)',border:'1px solid rgba(0,191,166,0.2)',borderRadius:'8px',padding:'10px 14px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)',lineHeight:1.6 }}>
          💡 After the artist <span style={{ color:'var(--cyan)' }}>accepts</span>, you can create the event and set all ticket details before launching it live.
        </div>

        <div style={{ display:'flex',gap:'10px',marginTop:'16px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Sending...' : '📨 Send Booking Request'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Event from Accepted Booking Modal ─────────────────────────────────
function CreateEventFromBookingModal({ booking, singers, onClose, onCreated }) {
  const singerInfo = singers.find(s => String(s.u_id) === String(booking.singer_id));
  const [form, setForm] = useState({
    title: '', description: '', poster: '',
    date:  booking.event_date ? booking.event_date.split('T')[0] : '',
    time:  '19:00',
    venue: booking.venue || '',
    city:  booking.city  || 'Dhaka',
    tier1_price: '', tier1_quantity: '',
    tier2_price: '', tier2_quantity: '',
    tier3_price: '', tier3_quantity: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState('');

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.venue || !form.date) { setErr('Title, venue and date are required'); return; }
    if (!form.tier1_quantity || Number(form.tier1_quantity) === 0) { setErr('Standing section capacity is required'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await api.post('/events', {
        booking_id:     booking.booking_id,
        title:          form.title,
        description:    form.description,
        poster:         form.poster,
        date:           form.date,
        time:           form.time || '19:00:00',
        venue:          form.venue,
        city:           form.city || 'Dhaka',
        tier1_price:    Number(form.tier1_price)    || 0,
        tier1_quantity: Number(form.tier1_quantity) || 0,
        tier2_price:    Number(form.tier2_price)    || 0,
        tier2_quantity: Number(form.tier2_quantity) || 0,
        tier3_price:    Number(form.tier3_price)    || 0,
        tier3_quantity: Number(form.tier3_quantity) || 0,
      });
      onCreated(res.data);
      onClose();
    } catch(e) { setErr(e.response?.data?.message || 'Failed to create event'); }
    finally { setSubmitting(false); }
  };

  const TIERS = [
    { n:1, color:'var(--gold)', label:'Standing — General Admission' },
    { n:2, color:'var(--cyan)', label:'Chair — Reserved Seating'     },
    { n:3, color:'#b040ff',     label:'Sofa — Premium / VIP'         },
  ];

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(6px)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }} onClick={onClose}>
      <div style={{ background:'var(--bg-card)',border:'1px solid rgba(0,212,255,0.25)',borderRadius:'var(--radius-lg)',maxWidth:'680px',width:'100%',maxHeight:'92vh',overflowY:'auto',padding:'32px' }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--cyan)',letterSpacing:'0.2em',marginBottom:'6px' }}>CREATE EVENT FROM ACCEPTED BOOKING</div>
        <h2 style={{ fontFamily:'var(--text-display)',fontSize:'20px',color:'var(--text-primary)',marginBottom:'8px' }}>Finalize Event Details</h2>

        {/* Singer info banner */}
        <div style={{ background:'rgba(0,191,166,0.06)',border:'1px solid rgba(0,191,166,0.2)',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',display:'flex',gap:'12px',alignItems:'center' }}>
          <div style={{ width:'40px',height:'40px',borderRadius:'50%',background:'rgba(0,191,166,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--cyan)',fontSize:'18px',flexShrink:0 }}>
            {(singerInfo?.unique_username || booking.singer_name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'var(--text-display)',fontSize:'13px',color:'var(--cyan)' }}>
              ✅ {singerInfo?.unique_username || booking.singer_name} has accepted your booking request
            </div>
            <div style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)',marginTop:'2px' }}>
              Proposed: {formatDate(booking.event_date)} · {booking.venue} · ৳{Number(booking.proposed_fee || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {err && <div className="alert alert-error" style={{ marginBottom:'16px' }}>{err}</div>}

        {/* Basic info */}
        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',letterSpacing:'0.15em',marginBottom:'12px' }}>EVENT DETAILS</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px' }}>
          <div className="form-group" style={{ margin:0,gridColumn:'1/-1' }}>
            <label className="form-label">Event Title *</label>
            <input className="form-control" placeholder="e.g. IIT-DU Tech Fest 2026 — Mega Night"
              value={form.title} onChange={e => setField('title', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Venue *</label>
            <input className="form-control" value={form.venue} onChange={e => setField('venue', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">City</label>
            <input className="form-control" value={form.city} onChange={e => setField('city', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Date *</label>
            <input className="form-control" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0 }}>
            <label className="form-label">Time</label>
            <input className="form-control" type="time" value={form.time} onChange={e => setField('time', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin:0,gridColumn:'1/-1' }}>
            <label className="form-label">Poster Image URL <span style={{ color:'var(--text-dim)',fontWeight:400 }}>(singer can also add later)</span></label>
            <input className="form-control" placeholder="https://..." value={form.poster} onChange={e => setField('poster', e.target.value)} />
            {form.poster && (
              <img src={form.poster} alt="preview"
                style={{ marginTop:'8px',width:'100%',maxHeight:'120px',objectFit:'cover',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>
          <div className="form-group" style={{ margin:0,gridColumn:'1/-1' }}>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} placeholder="Describe the event..."
              value={form.description} onChange={e => setField('description', e.target.value)} style={{ resize:'vertical' }} />
          </div>
        </div>

        {/* Ticket sections */}
        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',letterSpacing:'0.15em',marginBottom:'12px' }}>
          TICKET SECTIONS <span style={{ textTransform:'none',letterSpacing:0,fontWeight:400 }}>(0 = disabled)</span>
        </div>
        {TIERS.map(({ n, color, label }) => (
          <div key={n} style={{ background:'var(--bg-secondary)',border:`1px solid ${color}22`,borderLeft:`3px solid ${color}`,borderRadius:'var(--radius-sm)',padding:'14px 16px',marginBottom:'10px' }}>
            <div style={{ fontFamily:'var(--text-display)',fontSize:'12px',color,marginBottom:'10px',letterSpacing:'0.08em' }}>{label}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Price (৳) <span style={{ color:'var(--text-dim)',textTransform:'none',letterSpacing:0 }}>0 = free</span></label>
                <input className="form-control" type="number" min="0" placeholder="e.g. 300"
                  value={form[`tier${n}_price`]} onChange={e => setField(`tier${n}_price`, e.target.value)} />
              </div>
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Capacity <span style={{ color:'var(--text-dim)',textTransform:'none',letterSpacing:0 }}>0 = disabled</span></label>
                <input className="form-control" type="number" min="0" placeholder="e.g. 200"
                  value={form[`tier${n}_quantity`]} onChange={e => setField(`tier${n}_quantity`, e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <div style={{ background:'rgba(0,191,166,0.06)',border:'1px solid rgba(0,191,166,0.2)',borderRadius:'8px',padding:'12px 14px',marginTop:'16px',marginBottom:'20px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)',lineHeight:1.6 }}>
          ✅ Singer agreed — event will be <span style={{ color:'var(--cyan)' }}>immediately ready to launch</span>. No admin approval needed.
          After creating, click <span style={{ color:'var(--gold)' }}>🚀 Launch</span> to make it live for everyone.
        </div>

        <div style={{ display:'flex',gap:'10px' }}>
          <button className="btn btn-primary" onClick={handleCreate} disabled={submitting} style={{ flex:1 }}>
            {submitting ? 'Creating...' : '⚡ CREATE EVENT'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Sold Progress Cell ────────────────────────────────────────────────
function TicketSoldCell({ ev }) {
  const tiers = [
    { n:1, color:'var(--gold)', sold: Number(ev.tier1_sold||0), cap: Number(ev.tier1_quantity||0) },
    { n:2, color:'var(--cyan)', sold: Number(ev.tier2_sold||0), cap: Number(ev.tier2_quantity||0) },
    { n:3, color:'#b040ff',     sold: Number(ev.tier3_sold||0), cap: Number(ev.tier3_quantity||0) },
  ].filter(t => t.cap > 0);

  if (!tiers.length) return <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)' }}>—</span>;

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
      {tiers.map(t => {
        const pct = Math.min(Math.round((t.sold / t.cap) * 100), 100);
        return (
          <div key={t.n} style={{ display:'flex',alignItems:'center',gap:'6px' }}>
            <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:t.color,width:'56px',flexShrink:0 }}>
              {getTierLabel(t.n)}
            </span>
            <div style={{ flex:1,height:'5px',background:'rgba(255,255,255,0.07)',borderRadius:'3px',overflow:'hidden',minWidth:'50px' }}>
              <div style={{ height:'100%',width:`${pct}%`,background:t.color,borderRadius:'3px',transition:'width 0.6s' }} />
            </div>
            <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',whiteSpace:'nowrap' }}>
              {t.sold}/{t.cap}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user } = useAuth();

  const [events,     setEvents]     = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [singers,    setSingers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('EVENTS');
  const [alert,      setAlert]      = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [salesModal,        setSalesModal]        = useState(null);
  const [editPricesModal,   setEditPricesModal]   = useState(null);
  const [showBookModal,     setShowBookModal]      = useState(false);
  const [createFromBooking, setCreateFromBooking] = useState(null);

  const [qrCode,   setQrCode]   = useState('');
  const [qrResult, setQrResult] = useState(null);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/events/organizer/mine').catch(e => { console.error('mine:', e.response?.data); return { data: [] }; }),
      api.get('/events/organizer/bookings').catch(e => { console.error('bookings:', e.response?.data); return { data: [] }; }),
      api.get('/users/singers').catch(() => ({ data: [] })),
    ]).then(([ev, bk, sg]) => {
      setEvents(Array.isArray(ev.data) ? ev.data : (ev.data?.events || []));
      setBookings(Array.isArray(bk.data) ? bk.data : []);
      setSingers(Array.isArray(sg.data) ? sg.data : []);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLaunch = async (eventId, eventTitle) => {
    try {
      await api.post(`/events/${eventId}/launch`);
      showAlert('success', `🚀 "${eventTitle}" is now LIVE!`);
      setEvents(prev => prev.map(e => (e.event_id||e.id)===eventId ? { ...e, status:'live', launch:1 } : e));
    } catch(err) { showAlert('error', err.response?.data?.message || 'Failed to launch event'); }
  };

  const toggleDynamicPricing = async (eventId, current) => {
    try {
      const res = await api.put(`/events/${eventId}/dynamic-pricing`, { enabled: !current });
      showAlert('success', `🧠 Dynamic pricing ${res.data.enabled ? 'enabled' : 'disabled'}`);
      setEvents(prev => prev.map(e => (e.event_id||e.id)===eventId ? { ...e, dynamic_pricing_enable: res.data.enabled?1:0 } : e));
    } catch { showAlert('error', 'Failed to toggle dynamic pricing'); }
  };

  const handleQrScan = async () => {
    if (!qrCode) return;
    try {
      const res = await api.post('/tickets/scan', { qr_code: qrCode });
      setQrResult({ success: true, data: res.data });
    } catch(err) {
      setQrResult({ success: false, message: err.response?.data?.message || 'Invalid or already used ticket' });
    }
    setQrCode('');
  };

  const pendingBookings  = bookings.filter(b => b.status === 'pending');
  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
  const pendingEvents    = events.filter(e => e.status === 'pending');
  const launchableEvents = events.filter(e => e.status === 'approved' && !e.launch);

  const TABS = [
    { key:'EVENTS',     badge: launchableEvents.length > 0 ? `${launchableEvents.length} ready` : pendingEvents.length > 0 ? `${pendingEvents.length} pending` : null, badgeColor:'var(--cyan)' },
    { key:'BOOKINGS',   badge: pendingBookings.length > 0 ? pendingBookings.length : acceptedBookings.length > 0 ? `${acceptedBookings.length} accepted` : null, badgeColor: acceptedBookings.length > 0 ? '#00c878' : 'var(--gold)' },
    { key:'QR SCANNER', badge: null },
  ];

  return (
    <div className="page-wrapper">
      <div className="main-content">

        {/* Modals */}
        {salesModal && (
          <TicketSalesModal eventId={salesModal.id} eventTitle={salesModal.title} onClose={() => setSalesModal(null)} />
        )}
        {editPricesModal && (
          <EditPricesModal event={editPricesModal} onClose={() => setEditPricesModal(null)}
            onSaved={() => { refresh(); showAlert('success', '✅ Ticket prices updated!'); }} />
        )}
        {showBookModal && (
          <BookArtistModal singers={singers} onClose={() => setShowBookModal(false)}
            onSuccess={() => { refresh(); showAlert('success', '📨 Booking request sent! Wait for the singer to respond.'); }} />
        )}
        {createFromBooking && (
          <CreateEventFromBookingModal
            booking={createFromBooking}
            singers={singers}
            onClose={() => setCreateFromBooking(null)}
            onCreated={(data) => {
              refresh();
              showAlert('success', data?.launchable
                ? '🎉 Event created! Click 🚀 Launch to make it live.'
                : '🎉 Event created! Awaiting admin approval.');
              setActiveTab('EVENTS');
            }}
          />
        )}

        {/* Header */}
        <div style={{ marginBottom:'24px' }}>
          <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'6px' }}>Organizer Control Panel</div>
          <div className="flex-between">
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
              <h1 style={{ fontFamily:'var(--text-display)',fontSize:'22px',color:'#b040ff',letterSpacing:'0.08em',textShadow:'0 0 20px rgba(176,64,255,0.4)' }}>ORGANIZER DASHBOARD</h1>
              <button onClick={refresh} style={{ background:'rgba(176,64,255,0.08)',border:'1px solid rgba(176,64,255,0.25)',borderRadius:'8px',color:'#b040ff',cursor:'pointer',padding:'6px 12px',fontSize:'16px' }}>⟳</button>
            </div>
            <button className="btn btn-ghost" onClick={() => setShowBookModal(true)}>🎤 Book Artist</button>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom:'16px' }}>{alert.text}</div>}

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)',marginBottom:'24px' }}>
          <div className="stat-card cyan">
            <div><div className="stat-label">Total Events</div><div className="stat-value">{events.length}</div></div>
            <div className="stat-icon">🎵</div>
          </div>
          <div className="stat-card gold">
            <div><div className="stat-label">Ready to Launch</div><div className="stat-value">{launchableEvents.length}</div></div>
            <div className="stat-icon">🚀</div>
          </div>
          <div className="stat-card green">
            <div><div className="stat-label">Accepted Bookings</div><div className="stat-value">{acceptedBookings.length}</div></div>
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-card">
            <div><div className="stat-label">Pending Bookings</div><div className="stat-value">{pendingBookings.length}</div></div>
            <div className="stat-icon">📬</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="panel">
          <div className="panel-tabs">
            {TABS.map(tab => (
              <button key={tab.key} className={`panel-tab ${activeTab===tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.key}
                {tab.badge != null && (
                  <span style={{ marginLeft:'6px',background:tab.badgeColor,color:'#000',borderRadius:'20px',padding:'1px 6px',fontSize:'9px',fontWeight:'700' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="flex-center" style={{ padding:'40px' }}><div className="spinner" /></div>

            ) : activeTab === 'EVENTS' ? (
              events.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎵</div>
                  <div className="empty-title">NO EVENTS YET</div>
                  <div className="empty-sub">Book an artist first. Once they accept, you can create and launch an event.</div>
                  <button className="btn btn-primary" style={{ marginTop:'16px' }} onClick={() => setShowBookModal(true)}>🎤 Book an Artist</button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Tickets Sold</th>
                        <th>Status</th>
                        <th>🧠 AI Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => {
                        const id        = ev.event_id || ev.id;
                        const dpEnabled = ev.dynamic_pricing_enable === 1 || ev.dynamic_pricing_enable === true;
                        return (
                          <tr key={id}>
                            <td>
                              <div style={{ fontWeight:600,fontFamily:'var(--text-body)' }}>{ev.title}</div>
                              {ev.singer_name && (
                                <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',marginTop:'2px' }}>
                                  🎤 {ev.singer_name}
                                </div>
                              )}
                            </td>
                            <td style={{ fontFamily:'var(--text-mono)',fontSize:'12px',color:'var(--text-secondary)' }}>
                              {formatDate(ev.date || ev.event_date)}
                            </td>
                            <td>
                              {/* Live sold counts — populated by updated /organizer/mine query */}
                              <TicketSoldCell ev={ev} />
                            </td>
                            <td>
                              <span className="badge" style={{ color:STATUS_COLOR[ev.status]||'#888',background:`${STATUS_COLOR[ev.status]}18`,border:`1px solid ${STATUS_COLOR[ev.status]}44` }}>
                                {(ev.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                                <div
                                  onClick={() => toggleDynamicPricing(id, dpEnabled)}
                                  style={{ width:'40px',height:'22px',borderRadius:'11px',background:dpEnabled?'rgba(176,64,255,0.4)':'rgba(255,255,255,0.1)',border:dpEnabled?'1px solid #b040ff':'1px solid rgba(255,255,255,0.15)',cursor:'pointer',position:'relative',transition:'all 0.3s' }}>
                                  <div style={{ position:'absolute',top:'3px',left:dpEnabled?'20px':'3px',width:'14px',height:'14px',borderRadius:'50%',background:dpEnabled?'#b040ff':'#555',transition:'left 0.3s' }} />
                                </div>
                                <span style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:dpEnabled?'#b040ff':'var(--text-dim)' }}>
                                  {dpEnabled ? 'ON' : 'OFF'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display:'flex',gap:'5px',flexWrap:'wrap' }}>
                                {ev.status === 'approved' && !ev.launch && (
                                  <button onClick={() => handleLaunch(id, ev.title)} className="btn btn-sm"
                                    style={{ background:'linear-gradient(135deg,#00BFA6,#008f7a)',color:'#000',border:'none',fontWeight:'700' }}>
                                    🚀 Launch
                                  </button>
                                )}
                                <button onClick={() => setSalesModal({ id, title: ev.title })} className="btn btn-ghost btn-sm" title="Ticket sales">📊</button>
                                <button onClick={() => setEditPricesModal(ev)} className="btn btn-ghost btn-sm" title="Edit prices">✏️</button>
                                <Link to={`/concerts/${id}`} className="btn btn-primary btn-sm">View</Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )

            ) : activeTab === 'BOOKINGS' ? (
              bookings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📨</div>
                  <div className="empty-title">NO BOOKING REQUESTS</div>
                  <div className="empty-sub">Send a booking request to an artist to get started</div>
                  <button className="btn btn-primary" style={{ marginTop:'16px' }} onClick={() => setShowBookModal(true)}>🎤 Book an Artist</button>
                </div>
              ) : (
                <>
                  <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:'14px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowBookModal(true)}>+ New Booking Request</button>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
                    {bookings.map(b => (
                      <div key={b.booking_id} style={{
                        background:'var(--bg-secondary)',
                        border:`1px solid ${b.status==='accepted'?'rgba(0,200,120,0.3)':b.status==='rejected'?'rgba(255,82,82,0.2)':'rgba(255,255,255,0.08)'}`,
                        borderLeft:`3px solid ${b.status==='accepted'?'#00c878':b.status==='rejected'?'#FF5252':'rgba(255,179,0,0.5)'}`,
                        borderRadius:'var(--radius-sm)',padding:'16px',
                      }}>
                        <div className="flex-between" style={{ marginBottom:'10px',flexWrap:'wrap',gap:'8px' }}>
                          <div style={{ display:'flex',gap:'10px',alignItems:'center' }}>
                            <div style={{ width:'36px',height:'36px',borderRadius:'50%',background:'rgba(212,168,83,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gold)',fontSize:'16px',flexShrink:0 }}>
                              {(b.singer_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontFamily:'var(--text-display)',fontSize:'14px',color:'var(--text-primary)' }}>🎤 {b.singer_name}</div>
                              <div style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)',marginTop:'2px' }}>
                                📅 {formatDate(b.event_date)} · 📍 {b.venue} · ৳{Number(b.proposed_fee||0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <span className={`badge ${b.status==='accepted'?'badge-green':b.status==='rejected'?'badge-red':'badge-gold'}`}>
                            {(b.status || 'PENDING').toUpperCase()}
                          </span>
                        </div>

                        {b.message && (
                          <div style={{ fontFamily:'var(--text-body)',fontSize:'12px',color:'var(--text-dim)',fontStyle:'italic',marginBottom:'10px',paddingLeft:'10px',borderLeft:'2px solid rgba(255,179,0,0.2)' }}>
                            "{b.message}"
                          </div>
                        )}

                        {b.status === 'accepted' && (
                          <div style={{ marginTop:'10px',background:'rgba(0,200,120,0.06)',border:'1px solid rgba(0,200,120,0.2)',borderRadius:'8px',padding:'12px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px' }}>
                            <div>
                              <div style={{ fontFamily:'var(--text-display)',fontSize:'13px',color:'#00c878',marginBottom:'2px' }}>✅ Artist agreed to perform!</div>
                              <div style={{ fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)' }}>Set ticket details and launch the event live.</div>
                            </div>
                            <button onClick={() => setCreateFromBooking(b)} className="btn btn-sm"
                              style={{ background:'linear-gradient(135deg,#00c878,#009d5e)',color:'#000',border:'none',fontWeight:'700',padding:'8px 16px' }}>
                              ⚡ Create Event
                            </button>
                          </div>
                        )}

                        {b.status === 'rejected' && (
                          <div style={{ marginTop:'8px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'#FF5252' }}>✗ Artist declined this request.</div>
                        )}
                        {b.status === 'pending' && (
                          <div style={{ marginTop:'8px',fontFamily:'var(--text-mono)',fontSize:'11px',color:'var(--text-dim)' }}>⏳ Waiting for artist response...</div>
                        )}
                        <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',color:'var(--text-dim)',marginTop:'8px' }}>
                          Sent {formatDate(b.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )

            ) : (
              // QR SCANNER
              <div>
                <div style={{ fontFamily:'var(--text-mono)',fontSize:'10px',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:'12px' }}>
                  Enter QR Code or Ticket ID
                </div>
                <div style={{ display:'flex',gap:'10px',maxWidth:'480px',marginBottom:'24px' }}>
                  <input className="form-control" placeholder="Paste QR code value here..."
                    value={qrCode} onChange={e => setQrCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleQrScan()} />
                  <button className="btn btn-primary" onClick={handleQrScan}>SCAN</button>
                </div>
                {qrResult && (
                  <div className={`alert alert-${qrResult.success ? 'success' : 'error'}`}>
                    {qrResult.success
                      ? `✓ VALID — ${qrResult.data?.event_title || 'Event'} | Buyer: ${qrResult.data?.buyer || '—'}`
                      : `✗ INVALID — ${qrResult.message}`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
