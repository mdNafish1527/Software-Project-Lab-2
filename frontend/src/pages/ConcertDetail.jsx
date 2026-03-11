import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function ConcertDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INFO');
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [complaint, setComplaint] = useState({ subject: '', description: '' });
  const [alert, setAlert] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => {
        setEvent(res.data?.event || res.data);
        const tierData = res.data?.tiers || res.data?.ticket_tiers || [];
        setTiers(tierData);
        if (tierData.length > 0) setSelectedTier(tierData[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleBuyTicket = async () => {
    if (!user) { showAlert('error', 'Please login to buy tickets'); return; }
    if (!selectedTier) { showAlert('error', 'Select a ticket tier'); return; }
    setBuying(true);
    try {
      await api.post('/tickets/buy', {
        event_id: id,
        tier_id: selectedTier.id,
        quantity
      });
      showAlert('success', 'Tickets purchased! Check your email for QR codes.');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Purchase failed.');
    } finally {
      setBuying(false);
    }
  };

  const handleComplaint = async () => {
    if (!complaint.subject || !complaint.description) {
      showAlert('error', 'Fill in all complaint fields');
      return;
    }
    try {
      await api.post('/complaints', { ...complaint, event_id: id });
      setComplaint({ subject: '', description: '' });
      showAlert('success', 'Complaint submitted successfully');
    } catch {
      showAlert('error', 'Failed to submit complaint');
    }
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!event) return (
    <div className="main-content">
      <div className="empty-state">
        <div className="empty-icon">🎵</div>
        <div className="empty-title">EVENT NOT FOUND</div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #040810 0%, #0a1624 50%, #040810 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px'
          }}>
            🎵 Live Concert
          </div>
          <h1 style={{
            fontFamily: 'var(--text-display)', fontSize: '32px', color: 'var(--cyan)',
            letterSpacing: '0.06em', textShadow: 'var(--cyan-glow)', marginBottom: '16px'
          }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', text: event.venue || event.location || 'Venue TBD' },
              { icon: '📅', text: event.event_date ? new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date TBD' },
              { icon: '🎤', text: event.singer_name || 'Artist TBD' },
            ].map(item => (
              <div key={item.icon} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)'
              }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
            <span className="badge badge-green">LIVE</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        {alert && <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>{alert.text}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
          {/* Left: Info Tabs */}
          <div className="panel">
            <div className="panel-tabs">
              {['INFO', ...(user ? ['COMPLAINT'] : [])].map(tab => (
                <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="panel-body">
              {activeTab === 'INFO' ? (
                <div>
                  {event.description && (
                    <div style={{
                      fontFamily: 'var(--text-body)', fontSize: '15px', color: 'var(--text-secondary)',
                      lineHeight: 1.8, marginBottom: '20px'
                    }}>
                      {event.description}
                    </div>
                  )}
                  {tiers.length > 0 && (
                    <div>
                      <div style={{
                        fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px'
                      }}>
                        Available Ticket Tiers
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {tiers.map(tier => (
                          <div key={tier.id} style={{
                            background: 'var(--bg-secondary)', border: 'var(--border-dim)',
                            borderRadius: 'var(--radius-sm)', padding: '14px 18px', minWidth: '140px'
                          }}>
                            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                              {tier.name}
                            </div>
                            <div style={{ fontFamily: 'var(--text-display)', fontSize: '20px', color: 'var(--gold)', textShadow: 'var(--gold-glow)' }}>
                              ৳{tier.price?.toLocaleString()}
                            </div>
                            <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                              {tier.remaining || tier.capacity || '—'} available
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ maxWidth: '480px' }}>
                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)',
                    marginBottom: '16px', letterSpacing: '0.05em'
                  }}>
                    Submit a complaint about this event
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input className="form-control" placeholder="Brief subject"
                      value={complaint.subject} onChange={e => setComplaint(p => ({ ...p, subject: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={5} placeholder="Describe the issue in detail..."
                      value={complaint.description} onChange={e => setComplaint(p => ({ ...p, description: e.target.value }))}
                      style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-danger" onClick={handleComplaint}>
                    SUBMIT COMPLAINT
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Ticket Purchase */}
          {user?.role === 'audience' && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)',
              borderTop: '2px solid var(--cyan)', borderRadius: 'var(--radius-lg)',
              padding: '24px', height: 'fit-content'
            }}>
              <div style={{
                fontFamily: 'var(--text-mono)', fontSize: '11px', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: '20px'
              }}>
                Buy Tickets
              </div>

              <div className="form-group">
                <label className="form-label">Select Tier</label>
                <select className="form-control" value={selectedTier?.id || ''}
                  onChange={e => setSelectedTier(tiers.find(t => t.id == e.target.value))}>
                  {tiers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — ৳{t.price?.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity (max 10)</label>
                <input className="form-control" type="number" min={1} max={10}
                  value={quantity} onChange={e => setQuantity(Math.min(10, Math.max(1, Number(e.target.value))))} />
              </div>

              {selectedTier && (
                <div style={{
                  padding: '12px', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)', marginBottom: '16px'
                }}>
                  <div className="flex-between">
                    <span style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {quantity} × ৳{selectedTier.price?.toLocaleString()}
                    </span>
                    <span style={{ fontFamily: 'var(--text-display)', fontSize: '18px', color: 'var(--gold)', textShadow: 'var(--gold-glow)' }}>
                      ৳{(selectedTier.price * quantity)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <button className="btn btn-solid-cyan btn-block btn-lg" onClick={handleBuyTicket} disabled={buying || !tiers.length}>
                {buying ? 'PROCESSING...' : '⚡ BUY TICKETS'}
              </button>
              <div style={{
                fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)',
                textAlign: 'center', marginTop: '10px', letterSpacing: '0.05em'
              }}>
                QR codes sent to your email
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
