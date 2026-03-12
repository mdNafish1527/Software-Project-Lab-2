import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import PaymentGateway from '../components/PaymentGateway';

export default function ConcertDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INFO');
  const [selectedTier, setSelectedTier] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [complaint, setComplaint] = useState({ description: '' });
  const [alert, setAlert] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(res => {
        const ev = res.data?.event || res.data;
        setEvent(ev);

        // FIX #1: Backend returns FLAT fields (tier1_price, tier1_quantity…)
        // NOT a nested tiers array — build the array ourselves
        const built = [];
        if (ev?.tier1_price != null && ev?.tier1_quantity) {
          built.push({ id: 1, tierNum: 1, name: 'Tier 1 — General',  price: Number(ev.tier1_price), capacity: ev.tier1_quantity });
        }
        if (ev?.tier2_price != null && ev?.tier2_quantity) {
          built.push({ id: 2, tierNum: 2, name: 'Tier 2 — VIP',      price: Number(ev.tier2_price), capacity: ev.tier2_quantity });
        }
        if (ev?.tier3_price != null && ev?.tier3_quantity) {
          built.push({ id: 3, tierNum: 3, name: 'Tier 3 — Student',  price: Number(ev.tier3_price), capacity: ev.tier3_quantity });
        }
        setTiers(built);
        if (built.length > 0) setSelectedTier(built[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 5000);
  };

  // FIX #5: open payment gateway instead of calling API directly
  const handleBuyClick = () => {
    if (!user)         { showAlert('error', 'Please login to buy tickets'); return; }
    if (!selectedTier) { showAlert('error', 'Select a ticket tier'); return; }
    // Free tickets skip payment
    if (selectedTier.price === 0) { handleFreeTicket(); return; }
    setShowPayment(true);
  };

  const handleFreeTicket = async () => {
    try {
      await api.post('/tickets/buy', {
        event_id: Number(id),
        tier: selectedTier.tierNum,   // FIX #4: send 'tier' (1/2/3), not 'tier_id'
        quantity,
      });
      showAlert('success', '🎟️ Free ticket claimed! Check your email for QR codes.');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Could not claim ticket.');
    }
  };

  // Called by PaymentGateway after successful payment
  const handlePaymentSuccess = async (transactionId) => {
    setShowPayment(false);
    try {
      await api.post('/tickets/buy', {
        event_id: Number(id),
        tier: selectedTier.tierNum,   // FIX #4: send 'tier' (1/2/3), not 'tier_id'
        quantity,
        transaction_id: transactionId,
      });
      showAlert('success', `🎟️ ${quantity} ticket(s) purchased! QR codes sent to your email.`);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Payment done but ticket creation failed. Contact support.');
    }
  };

  const handleComplaint = async () => {
    if (!complaint.description) { showAlert('error', 'Please describe the issue'); return; }
    try {
      await api.post('/complaints', { event_id: Number(id), description: complaint.description });
      setComplaint({ description: '' });
      showAlert('success', 'Complaint submitted successfully');
    } catch {
      showAlert('error', 'Failed to submit complaint');
    }
  };

  // FIX #2: backend column is 'date', not 'event_date' — handle both
  const formatDate = (ev) => {
    const raw = ev?.date || ev?.event_date;
    if (!raw) return 'Date TBD';
    return new Date(raw).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // FIX #3: singer name may come back as singer_name or singer_username from JOIN
  const singerName = event?.singer_name || event?.singer_username || 'Artist TBD';

  const totalPrice = selectedTier ? selectedTier.price * quantity : 0;

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

      {/* Payment Gateway overlay */}
      {showPayment && (
        <PaymentGateway
          amount={totalPrice}
          itemDescription={`${quantity}× ${selectedTier?.name} — ${event.title}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #040810 0%, #0a1624 50%, #040810 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        padding: '40px 24px', position: 'relative', overflow: 'hidden'
      }}>
        {event.poster && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${event.poster})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.12, pointerEvents: 'none'
          }} />
        )}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px'
          }}>
            🎵 Live Concert
          </div>

          <h1 style={{
            fontFamily: 'var(--text-display)', fontSize: 'clamp(20px, 4vw, 32px)',
            color: 'var(--cyan)', letterSpacing: '0.06em',
            textShadow: 'var(--cyan-glow)', marginBottom: '14px'
          }}>
            {event.title}
          </h1>

          {/* Genre + duration badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {event.genre && (
              <span style={{
                fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.1em',
                padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                color: 'var(--cyan)'
              }}>
                🎸 {event.genre}
              </span>
            )}
            {event.duration_minutes && (
              <span style={{
                fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.1em',
                padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-dim)'
              }}>
                ⏱ {event.duration_minutes} mins
              </span>
            )}
            <span className="badge badge-green">LIVE</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', text: event.venue || 'Venue TBD' },
              { icon: '📅', text: formatDate(event) },
              { icon: '🕐', text: event.time ? String(event.time).slice(0, 5) : 'Time TBD' },
              { icon: '🎤', text: singerName },
              { icon: '🏙️', text: event.city || 'Dhaka' },
            ].map(item => (
              <div key={item.icon} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-secondary)'
              }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
            {alert.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>

          {/* Left: Info / Complaint tabs */}
          <div className="panel">
            <div className="panel-tabs">
              {['INFO', ...(user ? ['COMPLAINT'] : [])].map(tab => (
                <button key={tab}
                  className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
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
                      fontFamily: 'var(--text-body)', fontSize: '15px',
                      color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '28px'
                    }}>
                      {event.description}
                    </div>
                  )}

                  {/* FIX #1: Tiers now show because we built them from flat fields */}
                  {tiers.length > 0 ? (
                    <div>
                      <div style={{
                        fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px'
                      }}>
                        Available Ticket Tiers
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {tiers.map(tier => (
                          <div key={tier.id}
                            onClick={() => setSelectedTier(tier)}
                            style={{
                              background: 'var(--bg-secondary)',
                              border: selectedTier?.id === tier.id
                                ? '1px solid var(--cyan)'
                                : 'var(--border-dim)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '16px 20px', minWidth: '150px', cursor: 'pointer',
                              transition: 'border 0.2s'
                            }}>
                            <div style={{
                              fontFamily: 'var(--text-mono)', fontSize: '10px',
                              color: 'var(--text-dim)', marginBottom: '4px', letterSpacing: '0.1em'
                            }}>
                              {tier.name}
                            </div>
                            <div style={{
                              fontFamily: 'var(--text-display)', fontSize: '22px',
                              color: tier.price === 0 ? '#00ff64' : 'var(--gold)',
                              textShadow: 'var(--gold-glow)'
                            }}>
                              {tier.price === 0 ? 'FREE' : `৳${tier.price.toLocaleString()}`}
                            </div>
                            <div style={{
                              fontFamily: 'var(--text-mono)', fontSize: '10px',
                              color: 'var(--text-dim)', marginTop: '4px'
                            }}>
                              {tier.capacity?.toLocaleString()} seats
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)',
                      padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)'
                    }}>
                      🎟️ Ticket tiers not yet configured for this event.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ maxWidth: '480px' }}>
                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '11px',
                    color: 'var(--text-dim)', marginBottom: '16px', letterSpacing: '0.05em'
                  }}>
                    Submit a complaint about this event
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={5}
                      placeholder="Describe the issue in detail..."
                      value={complaint.description}
                      onChange={e => setComplaint({ description: e.target.value })}
                      style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-danger" onClick={handleComplaint}>
                    SUBMIT COMPLAINT
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Ticket purchase */}
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
                🎟️ Buy Tickets
              </div>

              {tiers.length === 0 ? (
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                  No tickets available yet.
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Select Tier</label>
                    <select className="form-control"
                      value={selectedTier?.id || ''}
                      onChange={e => setSelectedTier(tiers.find(t => t.id == e.target.value))}>
                      {tiers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.price === 0 ? 'FREE' : `৳${t.price.toLocaleString()}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity (max 10)</label>
                    <input className="form-control" type="number" min={1} max={10}
                      value={quantity}
                      onChange={e => setQuantity(Math.min(10, Math.max(1, Number(e.target.value))))} />
                  </div>

                  {selectedTier && (
                    <div style={{
                      padding: '14px', background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)', marginBottom: '16px'
                    }}>
                      <div className="flex-between">
                        <span style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {quantity} × {selectedTier.price === 0 ? 'FREE' : `৳${selectedTier.price.toLocaleString()}`}
                        </span>
                        <span style={{
                          fontFamily: 'var(--text-display)', fontSize: '20px',
                          color: totalPrice === 0 ? '#00ff64' : 'var(--gold)',
                          textShadow: 'var(--gold-glow)'
                        }}>
                          {totalPrice === 0 ? 'FREE' : `৳${totalPrice.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* FIX #5: Opens PaymentGateway instead of calling API directly */}
                  <button
                    className="btn btn-solid-cyan btn-block btn-lg"
                    onClick={handleBuyClick}
                    disabled={tiers.length === 0}>
                    {totalPrice === 0 ? '🎟️ CLAIM FREE TICKET' : '⚡ BUY TICKETS'}
                  </button>

                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)',
                    textAlign: 'center', marginTop: '10px', letterSpacing: '0.05em', lineHeight: 1.7
                  }}>
                    🔒 Secure payment via bKash / Nagad / Card<br />
                    QR codes sent to your email after purchase
                  </div>
                </>
              )}
            </div>
          )}

          {/* Not logged in nudge */}
          {!user && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)', padding: '24px',
              textAlign: 'center', height: 'fit-content'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
              <div style={{
                fontFamily: 'var(--text-mono)', fontSize: '12px',
                color: 'var(--text-dim)', marginBottom: '16px'
              }}>
                Login as Audience to buy tickets
              </div>
              <a href="/login" className="btn btn-solid-cyan btn-block">LOGIN</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
