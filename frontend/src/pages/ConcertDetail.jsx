import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const TIER_NAMES = {
  1: 'Chair',
  2: 'Standing',
  3: 'Sofa',
};

const TIER_FULL = {
  1: 'Chair - Reserved',
  2: 'Standing - General',
  3: 'Sofa - VIP',
};

const TIER_COLOR = {
  1: 'var(--cyan)',
  2: 'var(--gold)',
  3: '#b040ff',
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateValue(dateStr) {
  if (!dateStr) return 'Date TBD';

  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date TBD';
  }
}

function getProductImage(product) {
  return product.image || product.image_url || product.product_image || '';
}

function normalizeArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function adaptPricingResponse(raw) {
  if (!raw) return null;

  if (Array.isArray(raw.tiers)) {
    return {
      dynamic_enabled:
        Boolean(raw.dynamic_enabled) || Boolean(raw.dynamic_pricing_enabled),
      tiers: raw.tiers.map((tier) => ({
        tier: Number(tier.tier),
        price: Number(tier.price || tier.current_price || 0),
        base_price: Number(tier.base_price || 0),
        multiplier: Number(tier.multiplier || 1),
        remaining:
          tier.remaining == null ? null : Math.max(0, Number(tier.remaining || 0)),
        sold: Number(tier.sold || 0),
        capacity: Number(tier.capacity || tier.total || 0),
        reason: tier.reason || 'off',
      })),
      computed_at: raw.computed_at || raw.generated_at || null,
    };
  }

  if (!raw?.tiers || typeof raw.tiers !== 'object') return null;

  const tiersArray = [1, 2, 3]
    .filter((n) => raw.tiers[`tier${n}`] != null)
    .map((n) => {
      const t = raw.tiers[`tier${n}`];

      return {
        tier: n,
        price: Number(t.price ?? t.final_price ?? t.dynamic_price ?? 0),
        base_price: Number(t.base_price ?? 0),
        multiplier: Number(t.multiplier ?? 1),
        remaining: t.remaining == null ? null : Math.max(0, Number(t.remaining || 0)),
        sold: Number(t.sold || 0),
        capacity: Number(t.capacity || t.total || 0),
        reason: t.reason || 'off',
      };
    });

  return {
    dynamic_enabled:
      Boolean(raw.dynamic_enabled) || Boolean(raw.dynamic_pricing_enabled),
    tiers: tiersArray,
    computed_at: raw.computed_at || raw.generated_at || null,
  };
}

function ComplaintBox({ eventId, hasTicket }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = (e) => {
    const added = Array.from(e.target.files).map((file) => {
      const type = file.type.startsWith('image')
        ? 'image'
        : file.type.startsWith('audio')
        ? 'audio'
        : file.type.startsWith('video')
        ? 'video'
        : 'file';

      const preview = type === 'image' ? URL.createObjectURL(file) : null;

      return {
        file,
        preview,
        type,
        name: file.name,
        size: file.size,
      };
    });

    setFiles((prev) => [...prev, ...added].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      const next = [...prev];

      if (next[idx]?.preview) {
        URL.revokeObjectURL(next[idx].preview);
      }

      next.splice(idx, 1);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) {
      setError('Please write a description or attach at least one file.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('event_id', eventId);

      if (text.trim()) {
        fd.append('text_content', text.trim());
      }

      files.forEach((item) => fd.append('files', item.file));

      await api.post('/complaints', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
      setText('');
      setFiles([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasTicket) {
    return (
      <div
        style={{
          background: 'rgba(212,168,83,0.06)',
          border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎟️</div>
        <div
          style={{
            fontFamily: 'var(--text-mono)',
            fontSize: 12,
            color: 'var(--gold)',
            lineHeight: 1.6,
          }}
        >
          You need a ticket for this event to submit a complaint.
          <br />
          <span style={{ color: 'var(--text-dim)' }}>
            Purchase a ticket first, then come back here.
          </span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          background: 'rgba(0,191,166,0.07)',
          border: '1px solid rgba(0,191,166,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: 32,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
        <div
          style={{
            fontFamily: 'var(--text-display)',
            fontSize: 16,
            color: 'var(--cyan)',
            marginBottom: 8,
          }}
        >
          Complaint Submitted
        </div>
        <div
          style={{
            fontFamily: 'var(--text-mono)',
            fontSize: 11,
            color: 'var(--text-dim)',
            marginBottom: 20,
            lineHeight: 1.7,
          }}
        >
          Your complaint has been forwarded to the event organizer and system admin.
          <br />
          You can track its status from your dashboard.
        </div>

        <button
          onClick={() => setSubmitted(false)}
          style={{
            background: 'none',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 8,
            color: 'var(--cyan)',
            padding: '8px 20px',
            cursor: 'pointer',
            fontFamily: 'var(--text-mono)',
            fontSize: 12,
          }}
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div
        style={{
          fontFamily: 'var(--text-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
          letterSpacing: '0.05em',
          marginBottom: 18,
          lineHeight: 1.7,
          padding: '10px 14px',
          background: 'rgba(255,82,82,0.04)',
          border: '1px solid rgba(255,82,82,0.12)',
          borderRadius: 8,
        }}
      >
        ℹ️ Complaints are visible to the <span style={{ color: '#FF5252' }}>event organizer</span>{' '}
        and <span style={{ color: '#FF5252' }}>system admin</span>.
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(255,82,82,0.08)',
            border: '1px solid rgba(255,82,82,0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#FF5252',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-control"
          rows={5}
          placeholder="Describe your issue..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="form-label">
          Attachments
          <span
            style={{
              color: 'var(--text-dim)',
              textTransform: 'none',
              letterSpacing: 0,
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            up to 5 · images, audio, video
          </span>
        </label>

        <input
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFiles}
          style={{ display: 'none' }}
          id="complaint-files-upload"
        />

        <label
          htmlFor="complaint-files-upload"
          style={{
            display: 'block',
            border: '1.5px dashed rgba(0,212,255,0.22)',
            borderRadius: 10,
            padding: 22,
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(0,212,255,0.02)',
          }}
        >
          <div style={{ fontSize: 30, marginBottom: 7 }}>📎</div>
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: 12,
              color: 'var(--text-dim)',
            }}
          >
            Click to attach files
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                position: 'relative',
                background: 'var(--bg-secondary)',
                border: 'var(--border-dim)',
                borderRadius: 8,
                overflow: 'hidden',
                width: 140,
              }}
            >
              {f.type === 'image' && f.preview ? (
                <img
                  src={f.preview}
                  alt={f.name}
                  style={{
                    width: 140,
                    height: 90,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 140,
                    height: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ fontSize: 30 }}>
                    {f.type === 'audio' ? '🎵' : f.type === 'video' ? '📹' : '📎'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--text-mono)',
                      fontSize: 9,
                      color: 'var(--text-dim)',
                      textAlign: 'center',
                      padding: '0 6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 130,
                    }}
                  >
                    {f.name}
                  </span>
                </div>
              )}

              <button
                onClick={() => removeFile(i)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(0,0,0,0.75)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || (!text.trim() && files.length === 0)}
        className="btn btn-danger"
        style={{ opacity: submitting || (!text.trim() && files.length === 0) ? 0.5 : 1 }}
      >
        {submitting ? '⏳ Submitting...' : '📨 SUBMIT COMPLAINT'}
      </button>
    </div>
  );
}

function EventProductCard({ product, onViewProduct }) {
  const img = getProductImage(product);

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: 'var(--border-dim)',
        borderRadius: 'var(--radius-sm)',
        padding: 12,
      }}
    >
      {img ? (
        <img
          src={img}
          alt={product.name}
          style={{
            width: '100%',
            aspectRatio: '4 / 3',
            objectFit: 'contain',
            objectPosition: 'center',
            background: 'var(--bg-panel)',
            borderRadius: 8,
            display: 'block',
            padding: 6,
            marginBottom: 10,
          }}
        />
      ) : (
        <div
          style={{
            aspectRatio: '4 / 3',
            background: 'var(--bg-panel)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            marginBottom: 10,
          }}
        >
          🎵
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--text-display)',
          fontSize: 13,
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        {product.name || 'Concert Product'}
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          minHeight: 34,
        }}
      >
        {product.description || 'Dedicated concert product'}
      </div>

      <div className="flex-between" style={{ marginTop: 10, gap: 8 }}>
        <strong style={{ color: 'var(--gold)' }}>৳{formatMoney(product.price)}</strong>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Stock: {product.stock ?? 0}</span>
      </div>

      <button
        className="btn btn-primary btn-sm"
        style={{ marginTop: 10, width: '100%' }}
        onClick={() => onViewProduct(product)}
      >
        View Product
      </button>
    </div>
  );
}

export default function ConcertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [dynamicData, setDynamicData] = useState(null);
  const [eventProducts, setEventProducts] = useState([]);
  const [hasTicket, setHasTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('INFO');

  const buildTiersFromEvent = (ev) => {
    const built = [];

    for (const n of [1, 2, 3]) {
      const quantity = Number(ev?.[`tier${n}_quantity`] || 0);
      const price = Number(ev?.[`tier${n}_price`] || 0);

      if (quantity > 0 && price > 0) {
        built.push({
          id: n,
          tierNum: n,
          label: TIER_NAMES[n],
          name: TIER_FULL[n],
          price,
          capacity: quantity,
        });
      }
    }

    return built;
  };

  useEffect(() => {
    setLoading(true);

    api
      .get(`/events/${id}`)
      .then((res) => {
        const ev = res.data?.event || res.data;
        setEvent(ev);
        setTiers(buildTiersFromEvent(ev));
      })
      .catch(() => {
        setEvent(null);
        setTiers([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    api
      .get(`/pricing/event/${id}`)
      .then((res) => setDynamicData(adaptPricingResponse(res.data)))
      .catch(() => setDynamicData(null));
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'audience') return;

    api
      .get('/tickets/mine')
      .then((res) => {
        const purchases = res.data?.purchases || [];
        setHasTicket(purchases.some((purchase) => String(purchase.event_id) === String(id)));
      })
      .catch(() => setHasTicket(false));
  }, [id, user]);

  useEffect(() => {
    if (!user || user.role !== 'audience') return;

    setProductsLoading(true);

    api
      .get(`/tickets/event/${id}/products`)
      .then((res) => setEventProducts(normalizeArray(res.data, ['products', 'data'])))
      .catch(() => setEventProducts([]))
      .finally(() => setProductsLoading(false));
  }, [id, user]);

  const getDynamicTier = (tierNum) => {
    return dynamicData?.tiers?.find((tier) => Number(tier.tier) === Number(tierNum)) || null;
  };

  const handleViewProduct = (product) => {
    const productId = product.product_id || product.id;

    if (productId) {
      navigate(`/marketplace/product/${productId}`);
    } else {
      navigate('/marketplace');
    }
  };

  const singerName = event?.singer_name || 'Artist TBD';

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="main-content">
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <div className="empty-title">EVENT NOT FOUND</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div
        style={{
          background: 'linear-gradient(135deg,#040810 0%,#0a1624 50%,#040810 100%)',
          borderBottom: '1px solid rgba(0,212,255,0.15)',
          padding: '40px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {(event.poster || event.banner_image) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${event.poster || event.banner_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          />
        )}

        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            🎵 Concert
          </div>

          <h1
            style={{
              fontFamily: 'var(--text-display)',
              fontSize: 'clamp(20px,4vw,32px)',
              color: 'var(--cyan)',
              letterSpacing: '0.06em',
              textShadow: 'var(--cyan-glow)',
              marginBottom: 14,
            }}
          >
            {event.title}
          </h1>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { icon: '📍', text: event.venue || 'Venue TBD' },
              { icon: '📅', text: formatDateValue(event.date || event.event_date) },
              { icon: '🕐', text: event.time || event.event_time ? String(event.time || event.event_time).slice(0, 5) : 'Time TBD' },
              { icon: '🎤', text: singerName },
              { icon: '🏙️', text: event.city || 'Dhaka' },
            ].map((item, idx) => (
              <div
                key={`${item.icon}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--text-mono)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <div style={{ display: 'block' }}>
          <div className="panel" style={{ width: '100%' }}>
            <div className="panel-tabs">
              {['INFO', ...(user?.role === 'audience' ? ['COMPLAINT'] : [])].map((tab) => (
                <button
                  key={tab}
                  className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {tab === 'COMPLAINT' && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: hasTicket ? '#FF5252' : '#555',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '1px 7px',
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {hasTicket ? '● NEW' : '🔒'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="panel-body">
              {activeTab === 'INFO' ? (
                <div>
                  {event.description && (
                    <div
                      style={{
                        fontFamily: 'var(--text-body)',
                        fontSize: 15,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.8,
                        marginBottom: 28,
                      }}
                    >
                      {event.description}
                    </div>
                  )}

                  {tiers.length > 0 ? (
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--text-mono)',
                          fontSize: 10,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                          marginBottom: 12,
                        }}
                      >
                        Available Seat Types
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {tiers.map((tier) => {
                          const dp = getDynamicTier(tier.tierNum);
                          const shownPrice = Number(dp?.price || tier.price);
                          const remaining = dp?.remaining ?? null;
                          const soldOut = remaining !== null && remaining <= 0;
                          const color = TIER_COLOR[tier.tierNum] || 'var(--gold)';

                          return (
                            <div
                              key={tier.id}
                              style={{
                                background: 'var(--bg-secondary)',
                                border: soldOut
                                  ? '1px solid rgba(255,82,82,0.25)'
                                  : 'var(--border-dim)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '16px 20px',
                                minWidth: 180,
                                opacity: soldOut ? 0.72 : 1,
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: 'var(--text-mono)',
                                  fontSize: 10,
                                  color: 'var(--text-dim)',
                                  marginBottom: 4,
                                }}
                              >
                                {tier.name}
                              </div>

                              <div
                                style={{
                                  fontFamily: 'var(--text-display)',
                                  fontSize: 22,
                                  color: soldOut ? '#FF5252' : color,
                                  textShadow: 'var(--gold-glow)',
                                }}
                              >
                                {soldOut ? 'SOLD OUT' : `৳${formatMoney(shownPrice)}`}
                              </div>

                              {!soldOut && dp?.multiplier > 1.05 && (
                                <div
                                  style={{
                                    fontFamily: 'var(--text-mono)',
                                    fontSize: 10,
                                    color: 'var(--text-dim)',
                                    marginTop: 2,
                                  }}
                                >
                                  base ৳{formatMoney(tier.price)} ·{' '}
                                  <span style={{ color: '#ff8c42' }}>
                                    {Number(dp.multiplier).toFixed(2)}×
                                  </span>
                                </div>
                              )}

                              <div
                                style={{
                                  fontFamily: 'var(--text-mono)',
                                  fontSize: 10,
                                  color: 'var(--text-dim)',
                                  marginTop: 4,
                                }}
                              >
                                {remaining !== null
                                  ? `${remaining} remaining`
                                  : `${formatMoney(tier.capacity)} seats`}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontFamily: 'var(--text-mono)',
                        fontSize: 12,
                        color: 'var(--text-dim)',
                        padding: 20,
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      🎟️ Ticket tiers not yet configured for this event.
                    </div>
                  )}

                  {user?.role === 'audience' && (
                    <div style={{ marginTop: 28 }}>
                      <div
                        style={{
                          fontFamily: 'var(--text-mono)',
                          fontSize: 10,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                          marginBottom: 12,
                        }}
                      >
                        Concert Dedicated Products
                      </div>

                      {productsLoading ? (
                        <div className="flex-center" style={{ padding: 24 }}>
                          <div className="spinner" />
                        </div>
                      ) : eventProducts.length === 0 ? (
                        <div
                          style={{
                            fontFamily: 'var(--text-mono)',
                            fontSize: 12,
                            color: 'var(--text-dim)',
                            padding: 20,
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          No dedicated product added for this concert yet.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: 14,
                          }}
                        >
                          {eventProducts.map((product) => (
                            <EventProductCard
                              key={product.product_id || product.id}
                              product={product}
                              onViewProduct={handleViewProduct}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontFamily: 'var(--text-display)',
                        fontSize: 16,
                        color: '#FF5252',
                        marginBottom: 6,
                      }}
                    >
                      📋 Submit a Complaint
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--text-mono)',
                        fontSize: 11,
                        color: 'var(--text-dim)',
                      }}
                    >
                      Report an issue — sound, security, facilities, staff behaviour, or anything else.
                    </div>
                  </div>

                  <ComplaintBox eventId={Number(id)} hasTicket={hasTicket} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useCart } from '../context/CartContext';
// import api from '../api';

// // Default tier labels. The backend stores ticket types as tier numbers, but some
// // organizer-created events use only tier2/tier3 while the visible name is still
// // "Standing - General". So the UI below always prefers the event/backend label
// // and only uses these defaults as a final fallback.
// const TIER_SHORT_DEFAULT = { 1: 'Chair', 2: 'Standing', 3: 'Sofa' };
// const TIER_FULL_DEFAULT = {
//   1: 'Chair - Reserved',
//   2: 'Standing - General',
//   3: 'Sofa - VIP',
// };
// const TIER_COLOR = { 1: 'var(--cyan)', 2: 'var(--gold)', 3: '#b040ff' };

// function cleanTierName(value) {
//   if (value === null || value === undefined) return '';
//   return String(value).replace(/—/g, '-').replace(/\s+/g, ' ').trim();
// }

// function shortTierLabel(fullName, fallbackTierNum) {
//   const name = cleanTierName(fullName);
//   if (!name) return TIER_SHORT_DEFAULT[fallbackTierNum] || `Tier ${fallbackTierNum}`;
//   return name.split('-')[0].trim() || name;
// }

// function getEventTierName(ev, tierNum, configuredCount = 0) {
//   const possibleKeys = [
//     `tier${tierNum}_name`,
//     `tier${tierNum}_label`,
//     `tier${tierNum}_seat_type`,
//     `tier${tierNum}_type`,
//     `tier_${tierNum}_name`,
//     `tier_${tierNum}_label`,
//     `tier_${tierNum}_seat_type`,
//     `seat_type_${tierNum}`,
//     `seatType${tierNum}`,
//   ];

//   for (const key of possibleKeys) {
//     const value = cleanTierName(ev?.[key]);
//     if (value) return value;
//   }

//   return TIER_FULL_DEFAULT[tierNum] || `Tier ${tierNum}`;
// }

// const REASON_META = {
//   last_chance: {
//     label: '🔥 LAST CHANCE',
//     color: '#ff3c3c',
//     bg: 'rgba(255,60,60,0.12)',
//     border: 'rgba(255,60,60,0.4)',
//   },
//   almost_sold_out: {
//     label: '⚡ ALMOST GONE',
//     color: '#ff6b00',
//     bg: 'rgba(255,107,0,0.1)',
//     border: 'rgba(255,107,0,0.4)',
//   },
//   high_demand: {
//     label: '📈 HIGH DEMAND',
//     color: '#ffb300',
//     bg: 'rgba(255,179,0,0.1)',
//     border: 'rgba(255,179,0,0.4)',
//   },
//   selling_fast: {
//     label: '🚀 SELLING FAST',
//     color: '#00d4ff',
//     bg: 'rgba(0,212,255,0.08)',
//     border: 'rgba(0,212,255,0.35)',
//   },
//   standard: {
//     label: '✓ STANDARD PRICE',
//     color: '#00c878',
//     bg: 'rgba(0,200,120,0.07)',
//     border: 'rgba(0,200,120,0.25)',
//   },
//   off: { label: null, color: null, bg: null, border: null },
// };

// function formatMoney(value) {
//   return Number(value || 0).toLocaleString();
// }

// function formatDateValue(dateStr) {
//   if (!dateStr) return 'Date TBD';

//   try {
//     return new Date(dateStr).toLocaleDateString('en-GB', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   } catch {
//     return 'Date TBD';
//   }
// }

// function formatShortDate(dateStr) {
//   if (!dateStr) return '';

//   try {
//     return new Date(dateStr).toLocaleDateString('en-BD', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric',
//     });
//   } catch {
//     return '';
//   }
// }

// function getProductImage(product) {
//   return product.image || product.image_url || product.product_image || '';
// }

// function normalizeArray(data, keys = []) {
//   if (Array.isArray(data)) return data;

//   for (const key of keys) {
//     if (Array.isArray(data?.[key])) return data[key];
//   }

//   return [];
// }

// /**
//  * Converts backend /api/pricing/event/:eventId response into frontend shape.
//  * Supports both old camelCase and new snake_case fields.
//  */
// function adaptPricingResponse(raw) {
//   if (!raw?.tiers) return null;

//   const tiersArray = [1, 2, 3]
//     .filter((n) => raw.tiers[`tier${n}`] != null)
//     .map((n) => {
//       const t = raw.tiers[`tier${n}`];

//       const basePrice = Number(t.base_price ?? t.basePrice ?? 0);
//       const finalPrice = Number(
//         t.final_price ??
//           t.dynamic_price ??
//           t.dynamicPrice ??
//           t.price ??
//           basePrice
//       );

//       const multiplier = Number(
//         t.multiplier ?? (basePrice > 0 ? finalPrice / basePrice : 1)
//       );

//       const priceChange = t.price_change ?? t.priceChange ?? 'stable';
//       const percentChange = Number(t.percent_change ?? t.percentChange ?? 0);
//       const soldPercent = Number(t.sold_percent ?? t.soldPercent ?? 0);
//       const daysLeft = Number(t.days_left ?? t.daysLeft ?? 999);
//       const remaining =
//         t.remaining == null ? null : Math.max(0, Number(t.remaining || 0));

//       let reason = 'standard';

//       if (remaining !== null && remaining <= 0) {
//         reason = 'off';
//       } else if (priceChange === 'increased') {
//         if (soldPercent >= 90) reason = 'last_chance';
//         else if (soldPercent >= 80) reason = 'almost_sold_out';
//         else if (soldPercent >= 60) reason = 'high_demand';
//         else reason = 'selling_fast';
//       } else if (priceChange === 'decreased') {
//         reason = 'off';
//       }

//       return {
//         tier: n,
//         tier_name: cleanTierName(t.tier_name) || TIER_SHORT_DEFAULT[n],
//         price: finalPrice,
//         basePrice,
//         multiplier,
//         reason,
//         remaining,
//         total: Number(t.total || 0),
//         sold: Number(t.sold || 0),
//         soldPercent,
//         daysLeft,
//         priceChange,
//         percentChange,
//         demandLevel: t.demand_level || t.demandLevel || 'normal',
//         explanation: t.reason || '',
//         canBuy: remaining === null ? finalPrice > 0 : remaining > 0 && finalPrice > 0,
//         factors: {
//           scarcity: Math.min(1, soldPercent / 100),
//           velocity: 0,
//           urgency: daysLeft <= 3 ? 0.8 : daysLeft <= 7 ? 0.6 : daysLeft <= 14 ? 0.35 : 0.1,
//           occupancy: Math.min(1, soldPercent / 100),
//         },
//       };
//     });

//   const anyDynamic = Boolean(raw.dynamic_pricing_enabled);
//   const anySurge = tiersArray.some((tier) => tier.multiplier > 1.05);

//   return {
//     dynamic_enabled: anyDynamic || anySurge,
//     tiers: tiersArray,
//     computed_at: raw.generated_at,
//   };
// }

// function AnimatedPrice({ price, prev, color }) {
//   const [flash, setFlash] = useState(false);
//   const [dir, setDir] = useState(null);

//   useEffect(() => {
//     if (prev !== null && prev !== price) {
//       setDir(price > prev ? 'up' : 'down');
//       setFlash(true);

//       const timer = setTimeout(() => {
//         setFlash(false);
//         setDir(null);
//       }, 900);

//       return () => clearTimeout(timer);
//     }
//   }, [price, prev]);

//   const flashColor = dir === 'up' ? '#ff5050' : '#00c878';

//   return (
//     <div
//       style={{
//         fontFamily: 'var(--text-display)',
//         fontSize: 26,
//         color: flash ? flashColor : color || 'var(--gold)',
//         textShadow: flash ? `0 0 16px ${flashColor}` : 'var(--gold-glow)',
//         transition: 'color 0.3s, text-shadow 0.3s',
//         display: 'flex',
//         alignItems: 'center',
//         gap: 6,
//       }}
//     >
//       ৳{formatMoney(price)}
//       {dir === 'up' && <span style={{ fontSize: 14, color: '#ff5050' }}>▲</span>}
//       {dir === 'down' && <span style={{ fontSize: 14, color: '#00c878' }}>▼</span>}
//     </div>
//   );
// }

// function FactorBar({ label, value, max, color }) {
//   const pct = Math.min(100, Math.round((Number(value || 0) / max) * 100));

//   return (
//     <div style={{ marginBottom: 6 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
//         <span
//           style={{
//             fontFamily: 'var(--text-mono)',
//             fontSize: 9,
//             color: 'var(--text-dim)',
//             letterSpacing: '0.08em',
//           }}
//         >
//           {label}
//         </span>
//         <span style={{ fontFamily: 'var(--text-mono)', fontSize: 9, color }}>
//           {(Number(value || 0) * 100).toFixed(0)}%
//         </span>
//       </div>

//       <div
//         style={{
//           height: 4,
//           background: 'rgba(255,255,255,0.07)',
//           borderRadius: 2,
//           overflow: 'hidden',
//         }}
//       >
//         <div
//           style={{
//             height: '100%',
//             width: `${pct}%`,
//             background: color,
//             borderRadius: 2,
//             transition: 'width 0.8s ease',
//           }}
//         />
//       </div>
//     </div>
//   );
// }

// function DynamicTierCard({
//   tier,
//   dynamicData,
//   basePrice,
//   tierQty,
//   onQtyChange,
//   onAddToCart,
//   inCart,
//   isAdded,
//   adding,
// }) {
//   const [showFactors, setShowFactors] = useState(false);
//   const prevPrice = useRef(null);

//   const dp = dynamicData;
//   const price = Number(dp ? dp.price : basePrice);
//   const mult = Number(dp ? dp.multiplier : 1);
//   const reason = dp ? dp.reason : 'standard';
//   const meta = REASON_META[reason] || REASON_META.standard;
//   const isSurge = mult > 1.05 && reason !== 'off';
//   const factors = dp?.factors || {};
//   const color = TIER_COLOR[tier.tierNum];

//   const remaining = dp?.remaining ?? null;
//   const soldOut = remaining !== null && remaining <= 0;
//   const maxAvailable = remaining === null ? 10 : Math.max(1, Math.min(10, remaining));

//   useEffect(() => {
//     prevPrice.current = price;
//   }, [price]);

//   const prev = prevPrice.current;

//   return (
//     <div
//       style={{
//         background: 'var(--bg-secondary)',
//         borderRadius: 'var(--radius-sm)',
//         padding: 16,
//         border:
//           inCart > 0
//             ? '1px solid rgba(0,212,255,0.3)'
//             : isSurge
//             ? `1px solid ${meta.border}`
//             : soldOut
//             ? '1px solid rgba(255,82,82,0.25)'
//             : 'var(--border-dim)',
//         transition: 'border-color 0.4s',
//         opacity: soldOut ? 0.72 : 1,
//       }}
//     >
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'flex-start',
//           marginBottom: 10,
//         }}
//       >
//         <div>
//           <div
//             style={{
//               fontFamily: 'var(--text-mono)',
//               fontSize: 11,
//               color: 'var(--text-dim)',
//               letterSpacing: '0.1em',
//               marginBottom: 4,
//             }}
//           >
//             {tier.name}
//           </div>

//           <AnimatedPrice price={price} prev={prev !== price ? prev : null} color={color} />

//           {mult !== 1 && !soldOut && (
//             <div
//               style={{
//                 fontFamily: 'var(--text-mono)',
//                 fontSize: 10,
//                 color: 'var(--text-dim)',
//                 marginTop: 2,
//               }}
//             >
//               base ৳{formatMoney(basePrice)} ·{' '}
//               <span style={{ color: meta.color || color }}>{mult.toFixed(2)}×</span>
//             </div>
//           )}

//           {dp?.explanation && !soldOut && (
//             <div
//               style={{
//                 fontFamily: 'var(--text-mono)',
//                 fontSize: 9,
//                 color: 'var(--text-dim)',
//                 marginTop: 4,
//               }}
//             >
//               {dp.explanation}
//             </div>
//           )}
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
//           {soldOut ? (
//             <div
//               style={{
//                 background: 'rgba(255,82,82,0.08)',
//                 border: '1px solid rgba(255,82,82,0.3)',
//                 borderRadius: 20,
//                 padding: '3px 9px',
//                 fontFamily: 'var(--text-mono)',
//                 fontSize: 9,
//                 fontWeight: 700,
//                 color: '#FF5252',
//                 letterSpacing: '0.08em',
//               }}
//             >
//               SOLD OUT
//             </div>
//           ) : (
//             meta.label && (
//               <div
//                 style={{
//                   background: meta.bg,
//                   border: `1px solid ${meta.border}`,
//                   borderRadius: 20,
//                   padding: '3px 9px',
//                   fontFamily: 'var(--text-mono)',
//                   fontSize: 9,
//                   fontWeight: 700,
//                   color: meta.color,
//                   letterSpacing: '0.08em',
//                   whiteSpace: 'nowrap',
//                 }}
//               >
//                 {meta.label}
//               </div>
//             )
//           )}

//           {inCart > 0 && (
//             <span
//               style={{
//                 fontFamily: 'var(--text-mono)',
//                 fontSize: 10,
//                 color: 'var(--cyan)',
//                 background: 'rgba(0,212,255,0.1)',
//                 border: '1px solid rgba(0,212,255,0.2)',
//                 borderRadius: 20,
//                 padding: '2px 8px',
//               }}
//             >
//               🛒 {inCart} in cart
//             </span>
//           )}
//         </div>
//       </div>

//       {!soldOut && dp && (
//         <div style={{ marginBottom: 10 }}>
//           <button
//             onClick={() => setShowFactors((value) => !value)}
//             style={{
//               background: 'none',
//               border: 'none',
//               fontFamily: 'var(--text-mono)',
//               fontSize: 9,
//               color: 'var(--text-dim)',
//               cursor: 'pointer',
//               padding: 0,
//               letterSpacing: '0.08em',
//               display: 'flex',
//               alignItems: 'center',
//               gap: 4,
//             }}
//           >
//             {showFactors ? '▾' : '▸'} WHY THIS PRICE?
//           </button>

//           {showFactors && (
//             <div
//               style={{
//                 marginTop: 10,
//                 background: 'rgba(0,0,0,0.25)',
//                 borderRadius: 8,
//                 padding: 12,
//               }}
//             >
//               <FactorBar label="SCARCITY" value={factors.scarcity || 0} max={1} color="#ff6b00" />
//               <FactorBar label="TIME URGENCY" value={factors.urgency || 0} max={1} color="#b040ff" />

//               <div
//                 style={{
//                   marginTop: 10,
//                   paddingTop: 8,
//                   borderTop: '1px solid rgba(255,255,255,0.06)',
//                   fontFamily: 'var(--text-mono)',
//                   fontSize: 9,
//                   color: 'var(--text-dim)',
//                   lineHeight: 1.8,
//                 }}
//               >
//                 <div>{Math.round((factors.occupancy || 0) * 100)}% of seats sold</div>
//                 {remaining !== null && <div>{remaining} seats remaining</div>}
//                 {dp.daysLeft !== 999 && <div>{dp.daysLeft} day(s) left</div>}
//                 <div style={{ marginTop: 4, opacity: 0.6, fontSize: 8 }}>
//                   Prices refresh every 60 seconds.
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//         <button
//           onClick={() => onQtyChange(Math.max(1, tierQty - 1))}
//           disabled={soldOut}
//           style={{
//             width: 30,
//             height: 30,
//             borderRadius: 6,
//             background: 'rgba(255,255,255,0.06)',
//             border: '1px solid rgba(255,255,255,0.1)',
//             color: 'var(--text-primary)',
//             cursor: soldOut ? 'not-allowed' : 'pointer',
//             fontSize: 16,
//             opacity: soldOut ? 0.5 : 1,
//           }}
//         >
//           −
//         </button>

//         <input
//           type="number"
//           min={1}
//           max={maxAvailable}
//           value={tierQty}
//           disabled={soldOut}
//           onChange={(e) => {
//             const value = parseInt(e.target.value, 10) || 1;
//             onQtyChange(Math.min(maxAvailable, Math.max(1, value)));
//           }}
//           style={{
//             width: 44,
//             textAlign: 'center',
//             background: 'var(--bg-primary,#040810)',
//             border: '1px solid rgba(255,255,255,0.1)',
//             borderRadius: 6,
//             color: 'var(--text-primary)',
//             padding: 5,
//             fontSize: 14,
//             fontWeight: 600,
//             outline: 'none',
//             opacity: soldOut ? 0.5 : 1,
//           }}
//         />

//         <button
//           onClick={() => onQtyChange(Math.min(maxAvailable, tierQty + 1))}
//           disabled={soldOut}
//           style={{
//             width: 30,
//             height: 30,
//             borderRadius: 6,
//             background: 'rgba(255,255,255,0.06)',
//             border: '1px solid rgba(255,255,255,0.1)',
//             color: 'var(--text-primary)',
//             cursor: soldOut ? 'not-allowed' : 'pointer',
//             fontSize: 16,
//             opacity: soldOut ? 0.5 : 1,
//           }}
//         >
//           +
//         </button>

//         <button
//           onClick={onAddToCart}
//           disabled={soldOut || adding}
//           style={{
//             flex: 1,
//             background: soldOut
//               ? 'rgba(255,82,82,0.18)'
//               : isAdded
//               ? '#00BFA6'
//               : `linear-gradient(135deg,${color}cc,${color}88)`,
//             color: soldOut ? '#FF5252' : '#000',
//             border: soldOut ? '1px solid rgba(255,82,82,0.3)' : 'none',
//             borderRadius: 8,
//             padding: 8,
//             fontWeight: 700,
//             fontSize: 12,
//             cursor: soldOut || adding ? 'not-allowed' : 'pointer',
//             fontFamily: 'var(--text-mono)',
//             letterSpacing: '0.05em',
//             transition: 'background 0.2s',
//             opacity: adding ? 0.7 : 1,
//           }}
//         >
//           {soldOut ? 'SOLD OUT' : adding ? 'CHECKING...' : isAdded ? '✅ Added!' : '+ ADD TO CART'}
//         </button>
//       </div>

//       <div
//         style={{
//           fontFamily: 'var(--text-mono)',
//           fontSize: 10,
//           color: 'var(--text-dim)',
//           marginTop: 6,
//         }}
//       >
//         {soldOut ? (
//           'No seats remaining'
//         ) : (
//           <>
//             Subtotal: ৳{formatMoney(tierQty * price)} · max {maxAvailable}
//             {remaining !== null ? ` · ${remaining} remaining` : ''}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// function ComplaintBox({ eventId, hasTicket }) {
//   const fileRef = useRef();
//   const [text, setText] = useState('');
//   const [files, setFiles] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState('');

//   const handleFiles = (e) => {
//     const added = Array.from(e.target.files).map((file) => {
//       const type = file.type.startsWith('image')
//         ? 'image'
//         : file.type.startsWith('audio')
//         ? 'audio'
//         : file.type.startsWith('video')
//         ? 'video'
//         : 'file';

//       const preview = type === 'image' ? URL.createObjectURL(file) : null;

//       return {
//         file,
//         preview,
//         type,
//         name: file.name,
//         size: file.size,
//       };
//     });

//     setFiles((prev) => [...prev, ...added].slice(0, 5));
//     e.target.value = '';
//   };

//   const removeFile = (idx) => {
//     setFiles((prev) => {
//       const next = [...prev];

//       if (next[idx].preview) {
//         URL.revokeObjectURL(next[idx].preview);
//       }

//       next.splice(idx, 1);
//       return next;
//     });
//   };

//   const handleSubmit = async () => {
//     if (!text.trim() && files.length === 0) {
//       setError('Please write a description or attach at least one file.');
//       return;
//     }

//     setSubmitting(true);
//     setError('');

//     try {
//       const fd = new FormData();
//       fd.append('event_id', eventId);

//       if (text.trim()) {
//         fd.append('text_content', text.trim());
//       }

//       files.forEach((item) => fd.append('files', item.file));

//       await api.post('/complaints', fd, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       setSubmitted(true);
//       setText('');
//       setFiles([]);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to submit. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!hasTicket) {
//     return (
//       <div
//         style={{
//           background: 'rgba(212,168,83,0.06)',
//           border: '1px solid rgba(212,168,83,0.2)',
//           borderRadius: 'var(--radius-sm)',
//           padding: 24,
//           textAlign: 'center',
//         }}
//       >
//         <div style={{ fontSize: 32, marginBottom: 10 }}>🎟️</div>
//         <div
//           style={{
//             fontFamily: 'var(--text-mono)',
//             fontSize: 12,
//             color: 'var(--gold)',
//             lineHeight: 1.6,
//           }}
//         >
//           You need a ticket for this event to submit a complaint.
//           <br />
//           <span style={{ color: 'var(--text-dim)' }}>
//             Purchase a ticket first, then come back here.
//           </span>
//         </div>
//       </div>
//     );
//   }

//   if (submitted) {
//     return (
//       <div
//         style={{
//           background: 'rgba(0,191,166,0.07)',
//           border: '1px solid rgba(0,191,166,0.25)',
//           borderRadius: 'var(--radius-sm)',
//           padding: 32,
//           textAlign: 'center',
//         }}
//       >
//         <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
//         <div
//           style={{
//             fontFamily: 'var(--text-display)',
//             fontSize: 16,
//             color: 'var(--cyan)',
//             marginBottom: 8,
//           }}
//         >
//           Complaint Submitted
//         </div>
//         <div
//           style={{
//             fontFamily: 'var(--text-mono)',
//             fontSize: 11,
//             color: 'var(--text-dim)',
//             marginBottom: 20,
//             lineHeight: 1.7,
//           }}
//         >
//           Your complaint has been forwarded to the event organizer and system admin.
//           <br />
//           You can track its status from your dashboard.
//         </div>

//         <button
//           onClick={() => setSubmitted(false)}
//           style={{
//             background: 'none',
//             border: '1px solid rgba(0,212,255,0.3)',
//             borderRadius: 8,
//             color: 'var(--cyan)',
//             padding: '8px 20px',
//             cursor: 'pointer',
//             fontFamily: 'var(--text-mono)',
//             fontSize: 12,
//           }}
//         >
//           Submit Another
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div style={{ maxWidth: 560 }}>
//       <div
//         style={{
//           fontFamily: 'var(--text-mono)',
//           fontSize: 10,
//           color: 'var(--text-dim)',
//           letterSpacing: '0.05em',
//           marginBottom: 18,
//           lineHeight: 1.7,
//           padding: '10px 14px',
//           background: 'rgba(255,82,82,0.04)',
//           border: '1px solid rgba(255,82,82,0.12)',
//           borderRadius: 8,
//         }}
//       >
//         ℹ️ Complaints are visible to the{' '}
//         <span style={{ color: '#FF5252' }}>event organizer</span> and{' '}
//         <span style={{ color: '#FF5252' }}>system admin</span>.
//       </div>

//       {error && (
//         <div
//           style={{
//             background: 'rgba(255,82,82,0.08)',
//             border: '1px solid rgba(255,82,82,0.25)',
//             borderRadius: 8,
//             padding: '10px 14px',
//             color: '#FF5252',
//             fontSize: 13,
//             marginBottom: 14,
//           }}
//         >
//           ⚠️ {error}
//         </div>
//       )}

//       <div className="form-group">
//         <label className="form-label">Description</label>
//         <textarea
//           className="form-control"
//           rows={5}
//           placeholder="Describe your issue..."
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           style={{ resize: 'vertical' }}
//         />
//       </div>

//       <div style={{ marginBottom: 14 }}>
//         <label className="form-label">
//           Attachments
//           <span
//             style={{
//               color: 'var(--text-dim)',
//               textTransform: 'none',
//               letterSpacing: 0,
//               fontWeight: 400,
//               marginLeft: 6,
//             }}
//           >
//             up to 5 · images, audio, video
//           </span>
//         </label>

//         <input
//           ref={fileRef}
//           type="file"
//           multiple
//           accept="image/*,audio/*,video/*"
//           onChange={handleFiles}
//           style={{ display: 'none' }}
//         />

//         <div
//           onClick={() => fileRef.current.click()}
//           style={{
//             border: '1.5px dashed rgba(0,212,255,0.22)',
//             borderRadius: 10,
//             padding: 22,
//             textAlign: 'center',
//             cursor: 'pointer',
//             background: 'rgba(0,212,255,0.02)',
//           }}
//         >
//           <div style={{ fontSize: 30, marginBottom: 7 }}>📎</div>
//           <div
//             style={{
//               fontFamily: 'var(--text-mono)',
//               fontSize: 12,
//               color: 'var(--text-dim)',
//             }}
//           >
//             Click to attach files
//           </div>
//         </div>
//       </div>

//       {files.length > 0 && (
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
//           {files.map((f, i) => (
//             <div
//               key={`${f.name}-${i}`}
//               style={{
//                 position: 'relative',
//                 background: 'var(--bg-secondary)',
//                 border: 'var(--border-dim)',
//                 borderRadius: 8,
//                 overflow: 'hidden',
//                 width: 140,
//               }}
//             >
//               {f.type === 'image' && f.preview ? (
//                 <img
//                   src={f.preview}
//                   alt={f.name}
//                   style={{
//                     width: 140,
//                     height: 90,
//                     objectFit: 'cover',
//                     display: 'block',
//                   }}
//                 />
//               ) : (
//                 <div
//                   style={{
//                     width: 140,
//                     height: 90,
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     gap: 5,
//                   }}
//                 >
//                   <span style={{ fontSize: 30 }}>
//                     {f.type === 'audio' ? '🎵' : f.type === 'video' ? '📹' : '📎'}
//                   </span>
//                   <span
//                     style={{
//                       fontFamily: 'var(--text-mono)',
//                       fontSize: 9,
//                       color: 'var(--text-dim)',
//                       textAlign: 'center',
//                       padding: '0 6px',
//                       overflow: 'hidden',
//                       textOverflow: 'ellipsis',
//                       whiteSpace: 'nowrap',
//                       maxWidth: 130,
//                     }}
//                   >
//                     {f.name}
//                   </span>
//                 </div>
//               )}

//               <button
//                 onClick={() => removeFile(i)}
//                 style={{
//                   position: 'absolute',
//                   top: 4,
//                   right: 4,
//                   background: 'rgba(0,0,0,0.75)',
//                   border: 'none',
//                   borderRadius: '50%',
//                   width: 20,
//                   height: 20,
//                   color: '#fff',
//                   cursor: 'pointer',
//                   fontSize: 11,
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}
//               >
//                 ✕
//               </button>
//             </div>
//           ))}
//         </div>
//       )}

//       <button
//         onClick={handleSubmit}
//         disabled={submitting || (!text.trim() && files.length === 0)}
//         className="btn btn-danger"
//         style={{ opacity: submitting || (!text.trim() && files.length === 0) ? 0.5 : 1 }}
//       >
//         {submitting ? '⏳ Submitting...' : '📨 SUBMIT COMPLAINT'}
//       </button>
//     </div>
//   );
// }

// function EventProductCard({ product, onViewProduct }) {
//   const img = getProductImage(product);

//   return (
//     <div
//       style={{
//         background: 'var(--bg-secondary)',
//         border: 'var(--border-dim)',
//         borderRadius: 'var(--radius-sm)',
//         padding: 12,
//       }}
//     >
//       {img ? (
//         <img
//           src={img}
//           alt={product.name}
//           style={{
//             width: '100%',
//             aspectRatio: '4 / 3',
//             objectFit: 'contain',
//             objectPosition: 'center',
//             background: 'var(--bg-panel)',
//             borderRadius: 8,
//             display: 'block',
//             padding: 6,
//             marginBottom: 10,
//           }}
//         />
//       ) : (
//         <div
//           style={{
//             aspectRatio: '4 / 3',
//             background: 'var(--bg-panel)',
//             borderRadius: 8,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             fontSize: 32,
//             marginBottom: 10,
//           }}
//         >
//           🎵
//         </div>
//       )}

//       <div
//         style={{
//           fontFamily: 'var(--text-display)',
//           fontSize: 13,
//           color: 'var(--text-primary)',
//           marginBottom: 4,
//         }}
//       >
//         {product.name || 'Concert Product'}
//       </div>

//       <div
//         style={{
//           fontSize: 11,
//           color: 'var(--text-secondary)',
//           lineHeight: 1.5,
//           minHeight: 34,
//         }}
//       >
//         {product.description || 'Dedicated concert product'}
//       </div>

//       <div
//         className="flex-between"
//         style={{
//           marginTop: 10,
//           gap: 8,
//         }}
//       >
//         <strong style={{ color: 'var(--gold)' }}>৳{formatMoney(product.price)}</strong>
//         <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Stock: {product.stock ?? 0}</span>
//       </div>

//       <button
//         className="btn btn-primary btn-sm"
//         style={{ marginTop: 10, width: '100%' }}
//         onClick={() => onViewProduct(product)}
//       >
//         View Product
//       </button>
//     </div>
//   );
// }

// export default function ConcertDetail({ onOpenCart }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const cart = useCart();

//   const { addTicket, cartItems } = cart;

//   const [event, setEvent] = useState(null);
//   const [tiers, setTiers] = useState([]);
//   const [dynamicData, setDynamicData] = useState(null);
//   const [eventProducts, setEventProducts] = useState([]);
//   const [hasTicket, setHasTicket] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [dpLoading, setDpLoading] = useState(false);
//   const [productsLoading, setProductsLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('INFO');
//   const [alert, setAlert] = useState(null);
//   const [tierQty, setTierQty] = useState({ 1: 1, 2: 1, 3: 1 });
//   const [addedTier, setAddedTier] = useState(null);
//   const [addingTier, setAddingTier] = useState(null);

//   const dpInterval = useRef(null);

//   const showAlert = (type, text) => {
//     setAlert({ type, text });
//     setTimeout(() => setAlert(null), 5000);
//   };

//   const buildTiersFromEvent = (ev) => {
//     const configured = [1, 2, 3]
//       .map((n) => ({
//         n,
//         quantity: Number(ev?.[`tier${n}_quantity`] || ev?.[`tier_${n}_quantity`] || 0),
//         price: Number(ev?.[`tier${n}_price`] || ev?.[`tier_${n}_price`] || 0),
//       }))
//       .filter((item) => item.quantity > 0 && item.price > 0);

//     return configured.map(({ n, quantity, price }) => {
//       const fullName = getEventTierName(ev, n, configured.length);
//       const label = shortTierLabel(fullName, n);

//       return {
//         id: n,
//         tierNum: n,
//         label,
//         name: fullName,
//         price,
//         capacity: quantity,
//       };
//     });
//   };

//   useEffect(() => {
//     setLoading(true);

//     api
//       .get(`/events/${id}`)
//       .then((res) => {
//         const ev = res.data?.event || res.data;
//         setEvent(ev);
//         setTiers(buildTiersFromEvent(ev));
//       })
//       .catch(() => {
//         setEvent(null);
//         setTiers([]);
//       })
//       .finally(() => setLoading(false));
//   }, [id]);

//   const fetchDynamicPrice = useCallback(() => {
//     setDpLoading(true);

//     api
//       .get(`/pricing/event/${id}`)
//       .then((res) => {
//         const adapted = adaptPricingResponse(res.data);
//         setDynamicData(adapted);

//         if (adapted?.tiers?.length) {
//           setTierQty((prev) => {
//             const next = { ...prev };

//             for (const tier of adapted.tiers) {
//               if (tier.remaining !== null && tier.remaining > 0) {
//                 next[tier.tier] = Math.min(next[tier.tier] || 1, Math.min(10, tier.remaining));
//               }
//             }

//             return next;
//           });
//         }
//       })
//       .catch(() => {})
//       .finally(() => setDpLoading(false));
//   }, [id]);

//   useEffect(() => {
//     fetchDynamicPrice();
//     dpInterval.current = setInterval(fetchDynamicPrice, 60000);

//     return () => {
//       if (dpInterval.current) clearInterval(dpInterval.current);
//     };
//   }, [fetchDynamicPrice]);

//   useEffect(() => {
//     if (!user || user.role !== 'audience') return;

//     api
//       .get('/tickets/mine')
//       .then((res) => {
//         const purchases = res.data?.purchases || [];
//         const flatTickets = res.data?.tickets || [];
//         setHasTicket(
//           purchases.some((purchase) => String(purchase.event_id) === String(id)) ||
//             flatTickets.some((ticket) => String(ticket.event_id) === String(id))
//         );
//       })
//       .catch(() => {});
//   }, [id, user]);

//   useEffect(() => {
//     if (!user || user.role !== 'audience') return;

//     setProductsLoading(true);

//     api
//       .get(`/tickets/event/${id}/products`)
//       .then((res) => setEventProducts(normalizeArray(res.data, ['products', 'data'])))
//       .catch(() => setEventProducts([]))
//       .finally(() => setProductsLoading(false));
//   }, [id, user]);

//   const getDynamicTier = (tierNum) => {
//     return dynamicData?.tiers?.find((tier) => Number(tier.tier) === Number(tierNum)) || null;
//   };

//   const effectivePrice = (tier) => {
//     const dp = getDynamicTier(tier.tierNum);
//     return Number(dp ? dp.price : tier.price);
//   };

//   const cartTicketCount = (tierNum) => {
//     const cartId = `ticket-${id}-${tierNum}`;
//     return (cartItems || []).find((item) => item.cartId === cartId)?.quantity || 0;
//   };

//   const totalInCart = (cartItems || [])
//     .filter((item) => item.type === 'ticket' && String(item.event_id) === String(id))
//     .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

//   const totalTicketValue = (cartItems || [])
//     .filter((item) => item.type === 'ticket' && String(item.event_id) === String(id))
//     .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

//   const handleAddToCart = async (tier) => {
//     if (!user) {
//       showAlert('error', 'Please login to buy tickets');
//       return;
//     }

//     if (user.role !== 'audience') {
//       showAlert('error', 'Only audience accounts can buy tickets');
//       return;
//     }

//     const qty = Number(tierQty[tier.tierNum] || 1);
//     const dp = getDynamicTier(tier.tierNum);

//     if (dp?.remaining !== null && dp?.remaining <= 0) {
//       showAlert('error', `${tier.name} is sold out or not available`);
//       return;
//     }

//     setAddingTier(tier.tierNum);

//     try {
//       const quote = await api.get('/tickets/quote', {
//         params: {
//           event_id: Number(id),
//           tier: tier.tierNum,
//           quantity: qty,
//         },
//       });

//       if (!quote.data?.can_buy) {
//         const remaining = Math.max(0, Number(quote.data?.remaining || 0));
//         const tierName = tier.name || quote.data?.tier_name || tier.label;

//         if (remaining <= 0) {
//           showAlert('error', `${tierName} is sold out or not available for this event`);
//         } else {
//           showAlert('error', `Only ${remaining} seat(s) remaining in ${tierName}`);
//         }

//         fetchDynamicPrice();
//         return;
//       }

//       const price = Number(quote.data?.final_price || effectivePrice(tier));

//       addTicket(
//         {
//           id: Number(id),
//           event_id: Number(id),
//           title: event.title,
//           venue: event.venue,
//           event_date: event.date || event.event_date,
//           banner_image: event.poster || event.banner_image,
//         },
//         {
//           label: tier.name,
//           name: tier.name,
//           tier_name: tier.name,
//           tierNum: tier.tierNum,
//           tier: tier.tierNum,
//           price,
//         },
//         qty
//       );

//       setAddedTier(tier.tierNum);
//       setTimeout(() => setAddedTier(null), 2000);
//       showAlert('success', `✅ ${qty} × ${tier.name} added to cart at ৳${formatMoney(price)}!`);
//       fetchDynamicPrice();
//     } catch (err) {
//       showAlert('error', err.response?.data?.message || 'Could not add ticket to cart');
//     } finally {
//       setAddingTier(null);
//     }
//   };

//   const handleViewProduct = (product) => {
//     const productId = product.product_id || product.id;

//     if (productId) {
//       navigate(`/marketplace/product/${productId}`);
//     } else {
//       navigate('/marketplace');
//     }
//   };

//   const renderDpStatusBanner = () => {
//     if (!dynamicData?.dynamic_enabled) return null;

//     const time = dynamicData.computed_at
//       ? new Date(dynamicData.computed_at).toLocaleTimeString('en-BD', {
//           hour: '2-digit',
//           minute: '2-digit',
//         })
//       : '';

//     const maxMult = Math.max(1, ...(dynamicData.tiers || []).map((tier) => tier.multiplier || 1));
//     const anySurge = maxMult > 1.05;

//     return (
//       <div
//         style={{
//           background: anySurge ? 'rgba(255,107,0,0.07)' : 'rgba(176,64,255,0.06)',
//           border: `1px solid ${
//             anySurge ? 'rgba(255,107,0,0.3)' : 'rgba(176,64,255,0.25)'
//           }`,
//           borderRadius: 8,
//           padding: '10px 14px',
//           marginBottom: 14,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           gap: 8,
//           flexWrap: 'wrap',
//         }}
//       >
//         <div
//           style={{
//             fontFamily: 'var(--text-mono)',
//             fontSize: 10,
//             color: anySurge ? '#ff8c42' : '#b040ff',
//             letterSpacing: '0.08em',
//           }}
//         >
//           🧠 {anySurge ? `DEMAND PRICING ACTIVE · ${maxMult.toFixed(2)}× peak` : 'SMART PRICING ACTIVE'}
//         </div>

//         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <span style={{ fontFamily: 'var(--text-mono)', fontSize: 9, color: 'var(--text-dim)' }}>
//             updated {time}
//           </span>

//           <button
//             onClick={fetchDynamicPrice}
//             disabled={dpLoading}
//             style={{
//               background: 'none',
//               border: '1px solid rgba(255,255,255,0.1)',
//               borderRadius: 4,
//               color: 'var(--text-dim)',
//               cursor: 'pointer',
//               padding: '2px 8px',
//               fontFamily: 'var(--text-mono)',
//               fontSize: 9,
//             }}
//           >
//             {dpLoading ? '...' : '⟳'}
//           </button>
//         </div>
//       </div>
//     );
//   };

//   const singerName = event?.singer_name || 'Artist TBD';

//   if (loading) {
//     return (
//       <div className="flex-center" style={{ minHeight: '60vh' }}>
//         <div className="spinner" />
//       </div>
//     );
//   }

//   if (!event) {
//     return (
//       <div className="main-content">
//         <div className="empty-state">
//           <div className="empty-icon">🎵</div>
//           <div className="empty-title">EVENT NOT FOUND</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-wrapper">
//       <div
//         style={{
//           background: 'linear-gradient(135deg,#040810 0%,#0a1624 50%,#040810 100%)',
//           borderBottom: '1px solid rgba(0,212,255,0.15)',
//           padding: '40px 24px',
//           position: 'relative',
//           overflow: 'hidden',
//         }}
//       >
//         {event.poster && (
//           <div
//             style={{
//               position: 'absolute',
//               inset: 0,
//               backgroundImage: `url(${event.poster})`,
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//               opacity: 0.12,
//               pointerEvents: 'none',
//             }}
//           />
//         )}

//         <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
//           <div
//             style={{
//               fontFamily: 'var(--text-mono)',
//               fontSize: 10,
//               letterSpacing: '0.2em',
//               color: 'var(--text-dim)',
//               textTransform: 'uppercase',
//               marginBottom: 10,
//             }}
//           >
//             🎵 Concert
//           </div>

//           <h1
//             style={{
//               fontFamily: 'var(--text-display)',
//               fontSize: 'clamp(20px,4vw,32px)',
//               color: 'var(--cyan)',
//               letterSpacing: '0.06em',
//               textShadow: 'var(--cyan-glow)',
//               marginBottom: 14,
//             }}
//           >
//             {event.title}
//           </h1>

//           <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
//             {[
//               { icon: '📍', text: event.venue || 'Venue TBD' },
//               { icon: '📅', text: formatDateValue(event.date || event.event_date) },
//               { icon: '🕐', text: event.time ? String(event.time).slice(0, 5) : 'Time TBD' },
//               { icon: '🎤', text: singerName },
//               { icon: '🏙️', text: event.city || 'Dhaka' },
//             ].map((item) => (
//               <div
//                 key={item.icon}
//                 style={{
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: 8,
//                   fontFamily: 'var(--text-mono)',
//                   fontSize: 12,
//                   color: 'var(--text-secondary)',
//                 }}
//               >
//                 <span>{item.icon}</span>
//                 <span>{item.text}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="main-content">
//         {alert && (
//           <div className={`alert alert-${alert.type}`} style={{ marginBottom: 20 }}>
//             {alert.text}
//           </div>
//         )}

//         {totalInCart > 0 && (
//           <div
//             style={{
//               background: 'rgba(0,212,255,0.07)',
//               border: '1px solid rgba(0,212,255,0.25)',
//               borderRadius: 10,
//               padding: '12px 18px',
//               marginBottom: 20,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'space-between',
//               flexWrap: 'wrap',
//               gap: 10,
//             }}
//           >
//             <span style={{ fontFamily: 'var(--text-mono)', fontSize: 12, color: 'var(--cyan)' }}>
//               🎫 {totalInCart} ticket(s) from this event in your cart
//             </span>

//             <button
//               onClick={() => (typeof onOpenCart === 'function' ? onOpenCart() : navigate('/cart'))}
//               style={{
//                 background: 'linear-gradient(135deg,#D4A853,#B8922E)',
//                 color: '#000',
//                 padding: '8px 18px',
//                 borderRadius: 8,
//                 border: 'none',
//                 fontWeight: 700,
//                 fontSize: 13,
//                 cursor: 'pointer',
//               }}
//             >
//               🛒 View Cart →
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
//           <div className="panel">
//             <div className="panel-tabs">
//               {['INFO', ...(user?.role === 'audience' ? ['COMPLAINT'] : [])].map((tab) => (
//                 <button
//                   key={tab}
//                   className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
//                   onClick={() => setActiveTab(tab)}
//                 >
//                   {tab}
//                   {tab === 'COMPLAINT' && (
//                     <span
//                       style={{
//                         marginLeft: 6,
//                         background: hasTicket ? '#FF5252' : '#555',
//                         color: '#fff',
//                         borderRadius: 20,
//                         padding: '1px 7px',
//                         fontSize: 9,
//                         fontWeight: 700,
//                       }}
//                     >
//                       {hasTicket ? '● NEW' : '🔒'}
//                     </span>
//                   )}
//                 </button>
//               ))}
//             </div>

//             <div className="panel-body">
//               {activeTab === 'INFO' ? (
//                 <div>
//                   {event.description && (
//                     <div
//                       style={{
//                         fontFamily: 'var(--text-body)',
//                         fontSize: 15,
//                         color: 'var(--text-secondary)',
//                         lineHeight: 1.8,
//                         marginBottom: 28,
//                       }}
//                     >
//                       {event.description}
//                     </div>
//                   )}

//                   {tiers.length > 0 ? (
//                     <div>
//                       <div
//                         style={{
//                           fontFamily: 'var(--text-mono)',
//                           fontSize: 10,
//                           letterSpacing: '0.15em',
//                           textTransform: 'uppercase',
//                           color: 'var(--text-secondary)',
//                           marginBottom: 12,
//                         }}
//                       >
//                         Available Seat Types
//                       </div>

//                       <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
//                         {tiers.map((tier) => {
//                           const dp = getDynamicTier(tier.tierNum);
//                           const price = dp ? dp.price : tier.price;
//                           const color = TIER_COLOR[tier.tierNum];
//                           const remaining = dp?.remaining ?? null;
//                           const soldOut = remaining !== null && remaining <= 0;

//                           return (
//                             <div
//                               key={tier.id}
//                               style={{
//                                 background: 'var(--bg-secondary)',
//                                 border: soldOut
//                                   ? '1px solid rgba(255,82,82,0.25)'
//                                   : 'var(--border-dim)',
//                                 borderRadius: 'var(--radius-sm)',
//                                 padding: '16px 20px',
//                                 minWidth: 160,
//                                 opacity: soldOut ? 0.72 : 1,
//                               }}
//                             >
//                               <div
//                                 style={{
//                                   fontFamily: 'var(--text-mono)',
//                                   fontSize: 10,
//                                   color: 'var(--text-dim)',
//                                   marginBottom: 4,
//                                 }}
//                               >
//                                 {tier.name}
//                               </div>

//                               <div
//                                 style={{
//                                   fontFamily: 'var(--text-display)',
//                                   fontSize: 22,
//                                   color: soldOut ? '#FF5252' : color,
//                                   textShadow: 'var(--gold-glow)',
//                                 }}
//                               >
//                                 {soldOut ? 'SOLD OUT' : `৳${formatMoney(price)}`}
//                               </div>

//                               {!soldOut && dp?.multiplier > 1.05 && (
//                                 <div
//                                   style={{
//                                     fontFamily: 'var(--text-mono)',
//                                     fontSize: 10,
//                                     color: 'var(--text-dim)',
//                                     marginTop: 2,
//                                   }}
//                                 >
//                                   base ৳{formatMoney(tier.price)} ·{' '}
//                                   <span style={{ color: '#ff8c42' }}>
//                                     {dp.multiplier.toFixed(2)}×
//                                   </span>
//                                 </div>
//                               )}

//                               <div
//                                 style={{
//                                   fontFamily: 'var(--text-mono)',
//                                   fontSize: 10,
//                                   color: 'var(--text-dim)',
//                                   marginTop: 4,
//                                 }}
//                               >
//                                 {remaining !== null
//                                   ? `${remaining} remaining`
//                                   : `${formatMoney(tier.capacity)} seats`}
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     </div>
//                   ) : (
//                     <div
//                       style={{
//                         fontFamily: 'var(--text-mono)',
//                         fontSize: 12,
//                         color: 'var(--text-dim)',
//                         padding: 20,
//                         background: 'var(--bg-secondary)',
//                         borderRadius: 'var(--radius-sm)',
//                       }}
//                     >
//                       🎟️ Ticket tiers not yet configured for this event.
//                     </div>
//                   )}

//                   {user?.role === 'audience' && (
//                     <div style={{ marginTop: 28 }}>
//                       <div
//                         style={{
//                           fontFamily: 'var(--text-mono)',
//                           fontSize: 10,
//                           letterSpacing: '0.15em',
//                           textTransform: 'uppercase',
//                           color: 'var(--text-secondary)',
//                           marginBottom: 12,
//                         }}
//                       >
//                         Concert Dedicated Products
//                       </div>

//                       {productsLoading ? (
//                         <div className="flex-center" style={{ padding: 24 }}>
//                           <div className="spinner" />
//                         </div>
//                       ) : eventProducts.length === 0 ? (
//                         <div
//                           style={{
//                             fontFamily: 'var(--text-mono)',
//                             fontSize: 12,
//                             color: 'var(--text-dim)',
//                             padding: 20,
//                             background: 'var(--bg-secondary)',
//                             borderRadius: 'var(--radius-sm)',
//                           }}
//                         >
//                           No dedicated product added for this concert yet.
//                         </div>
//                       ) : (
//                         <div
//                           style={{
//                             display: 'grid',
//                             gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
//                             gap: 14,
//                           }}
//                         >
//                           {eventProducts.map((product) => (
//                             <EventProductCard
//                               key={product.product_id || product.id}
//                               product={product}
//                               onViewProduct={handleViewProduct}
//                             />
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div>
//                   <div style={{ marginBottom: 20 }}>
//                     <div
//                       style={{
//                         fontFamily: 'var(--text-display)',
//                         fontSize: 16,
//                         color: '#FF5252',
//                         marginBottom: 6,
//                       }}
//                     >
//                       📋 Submit a Complaint
//                     </div>
//                     <div
//                       style={{
//                         fontFamily: 'var(--text-mono)',
//                         fontSize: 11,
//                         color: 'var(--text-dim)',
//                       }}
//                     >
//                       Report an issue — sound, security, facilities, staff behaviour, or anything else.
//                     </div>
//                   </div>

//                   <ComplaintBox eventId={Number(id)} hasTicket={hasTicket} />
//                 </div>
//               )}
//             </div>
//           </div>

//           {user?.role === 'audience' && (
//             <div
//               style={{
//                 background: 'var(--bg-card)',
//                 border: '1px solid rgba(0,212,255,0.2)',
//                 borderTop: '2px solid var(--cyan)',
//                 borderRadius: 'var(--radius-lg)',
//                 padding: 24,
//                 height: 'fit-content',
//               }}
//             >
//               <div
//                 style={{
//                   fontFamily: 'var(--text-mono)',
//                   fontSize: 11,
//                   letterSpacing: '0.15em',
//                   textTransform: 'uppercase',
//                   color: 'var(--cyan)',
//                   marginBottom: 16,
//                 }}
//               >
//                 🎟️ Select Seat Type
//               </div>

//               {renderDpStatusBanner()}

//               {tiers.length === 0 ? (
//                 <div
//                   style={{
//                     fontFamily: 'var(--text-mono)',
//                     fontSize: 12,
//                     color: 'var(--text-dim)',
//                   }}
//                 >
//                   No tickets available yet.
//                 </div>
//               ) : (
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//                   {tiers.map((tier) => (
//                     <DynamicTierCard
//                       key={tier.id}
//                       tier={tier}
//                       dynamicData={getDynamicTier(tier.tierNum)}
//                       basePrice={tier.price}
//                       tierQty={tierQty[tier.tierNum] || 1}
//                       onQtyChange={(value) =>
//                         setTierQty((qty) => ({ ...qty, [tier.tierNum]: value }))
//                       }
//                       onAddToCart={() => handleAddToCart(tier)}
//                       inCart={cartTicketCount(tier.tierNum)}
//                       isAdded={addedTier === tier.tierNum}
//                       adding={addingTier === tier.tierNum}
//                     />
//                   ))}

//                   {totalInCart > 0 && (
//                     <button
//                       onClick={() => (typeof onOpenCart === 'function' ? onOpenCart() : navigate('/cart'))}
//                       style={{
//                         display: 'block',
//                         width: '100%',
//                         background: 'linear-gradient(135deg,#D4A853,#B8922E)',
//                         color: '#000',
//                         border: 'none',
//                         borderRadius: 10,
//                         padding: 13,
//                         fontWeight: 800,
//                         fontSize: 14,
//                         cursor: 'pointer',
//                         fontFamily: 'var(--text-mono)',
//                         letterSpacing: '0.05em',
//                         textAlign: 'center',
//                       }}
//                     >
//                       🛒 VIEW CART · ৳{formatMoney(totalTicketValue)}
//                     </button>
//                   )}

//                   <div
//                     style={{
//                       fontFamily: 'var(--text-mono)',
//                       fontSize: 10,
//                       color: 'var(--text-dim)',
//                       textAlign: 'center',
//                       letterSpacing: '0.05em',
//                       lineHeight: 1.7,
//                     }}
//                   >
//                     🔒 Secure checkout via cart
//                     <br />
//                     {dynamicData?.dynamic_enabled
//                       ? '🧠 Prices refresh every 60 seconds based on demand'
//                       : 'Ticket availability is checked before payment'}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {!user && (
//             <div
//               style={{
//                 background: 'var(--bg-card)',
//                 border: '1px solid rgba(255,255,255,0.08)',
//                 borderRadius: 'var(--radius-lg)',
//                 padding: 24,
//                 textAlign: 'center',
//                 height: 'fit-content',
//               }}
//             >
//               <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
//               <div
//                 style={{
//                   fontFamily: 'var(--text-mono)',
//                   fontSize: 12,
//                   color: 'var(--text-dim)',
//                   marginBottom: 16,
//                 }}
//               >
//                 Login as Audience to buy tickets
//               </div>
//               <a href="/login" className="btn btn-solid-cyan btn-block">
//                 LOGIN
//               </a>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
