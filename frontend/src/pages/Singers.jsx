import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const ConcertDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [tier, setTier] = useState(1);
  const [qty, setQty] = useState(1);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaint, setComplaint] = useState({ description: '', evidence: '' });

  useEffect(() => {
    API.get(`/events/${id}`)
      .then(r => { setEvent(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'audience') return toast.error('Only audience members can buy tickets');
    setBuying(true);
    try {
      const res = await API.post('/tickets/buy', { event_id: id, tier, quantity: qty });
      toast.success(`🎟️ ${res.data.tickets.length} ticket(s) purchased! Check your email.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    try {
      await API.post('/complaints', { event_id: id, ...complaint });
      toast.success('Complaint submitted');
      setShowComplaint(false);
      setComplaint({ description: '', evidence: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    }
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!event) return <div className="page"><div className="container"><h2>Event not found</h2></div></div>;

  const tierOptions = [
    { tier: 1, price: event.tier1_price, qty: event.tier1_quantity },
    { tier: 2, price: event.tier2_price, qty: event.tier2_quantity },
    { tier: 3, price: event.tier3_price, qty: event.tier3_quantity },
  ].filter(t => t.price);

  const selectedTier = tierOptions.find(t => t.tier === tier);
  const totalCost = selectedTier ? selectedTier.price * qty : 0;

  return (
    <div className="page">
      {/* Banner */}
      <div style={{
        height: 320,
        background: event.poster
          ? `url(${event.poster}) center/cover`
          : 'linear-gradient(135deg, #1a0e00, #2a1500)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,0.9), transparent)' }} />
        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: 8 }}>🟢 Live Now</span>
            <h1 style={{ fontSize: '2.2rem' }}>{event.title}</h1>
            <p style={{ color: 'var(--muted)' }}>🎤 {event.singer_name} &nbsp;·&nbsp; Organized by {event.organizer_name}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          {/* Left: Details */}
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: 16 }}>Event Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    ['📅 Date', new Date(event.date).toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                    ['⏰ Time', event.time],
                    ['📍 Venue', event.venue],
                    ['🏙️ City', event.city],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
                      <p style={{ fontWeight: 600 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-body">
                  <h3 style={{ marginBottom: 12 }}>About This Concert</h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{event.description}</p>
                </div>
              </div>
            )}

            {/* Artist Card */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <img src={event.singer_pic || 'https://via.placeholder.com/60'} alt={event.singer_name}
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>Performing Artist</p>
                  <h3 style={{ fontSize: '1.1rem' }}>{event.singer_name}</h3>
                </div>
              </div>
            </div>

            {/* Complaint */}
            {user && (
              <button onClick={() => setShowComplaint(!showComplaint)} className="btn btn-outline btn-sm">
                ⚠️ Submit a Complaint
              </button>
            )}

            {showComplaint && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-body">
                  <h4 style={{ marginBottom: 16 }}>Submit Complaint</h4>
                  <form onSubmit={handleComplaint}>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea className="form-control" rows={4} value={complaint.description}
                        onChange={e => setComplaint({ ...complaint, description: e.target.value })}
                        placeholder="Describe the issue..." />
                    </div>
                    <div className="form-group">
                      <label>Evidence (Photo/Video URL)</label>
                      <input className="form-control" placeholder="https://..." value={complaint.evidence}
                        onChange={e => setComplaint({ ...complaint, evidence: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-danger">Submit Complaint</button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Right: Ticket purchase */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div className="card-body">
                <h3 style={{ marginBottom: 20 }}>Get Tickets</h3>

                <div className="form-group">
                  <label>Select Tier</label>
                  {tierOptions.map(t => (
                    <div key={t.tier} onClick={() => setTier(t.tier)} style={{
                      padding: '12px 16px', borderRadius: 10, border: `2px solid ${tier === t.tier ? 'var(--gold)' : 'var(--border)'}`,
                      marginBottom: 8, cursor: 'pointer', transition: 'var(--transition)',
                      background: tier === t.tier ? 'rgba(245,166,35,0.08)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Tier {t.tier}</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>৳{t.price}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{t.qty} available</div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Quantity (max 10)</label>
                  <input type="number" className="form-control" min={1} max={10}
                    value={qty} onChange={e => setQty(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} />
                </div>

                <hr className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: 'var(--muted)' }}>Total</span>
                  <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.2rem' }}>৳{totalCost}</span>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleBuy} disabled={buying || !user}>
                  {buying ? 'Processing...' : user ? '🎟️ Buy Tickets' : 'Log in to Buy'}
                </button>

                {!user && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 10 }}>You must be logged in to purchase</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConcertDetail;