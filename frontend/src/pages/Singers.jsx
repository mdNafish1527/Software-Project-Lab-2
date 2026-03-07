import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Singers() {
  const [singers, setSingers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users/singers')
      .then(res => { setSingers(res.data || []); setFiltered(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q
      ? singers.filter(s => s.name?.toLowerCase().includes(q) || s.genre?.toLowerCase().includes(q))
      : singers
    );
  }, [search, singers]);

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Artist Registry
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '26px', color: 'var(--gold)',
              letterSpacing: '0.08em', textShadow: 'var(--gold-glow)'
            }}>
              ARTISTS
            </h1>
            <span className="badge badge-gold">{filtered.length} VERIFIED</span>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input
            className="form-control"
            placeholder="Search artists by name or genre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '80px' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <div className="empty-title">NO ARTISTS FOUND</div>
              <div className="empty-sub">Try a different search term</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {filtered.map(singer => (
              <Link key={singer.id} to={`/singers/${singer.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-card)', border: 'var(--border-dim)',
                  borderRadius: 'var(--radius-lg)', padding: '24px',
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(255,179,0,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                }}>
                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div className="avatar avatar-md" style={{
                      background: 'linear-gradient(135deg, rgba(255,179,0,0.2), rgba(255,179,0,0.05))',
                      border: '2px solid rgba(255,179,0,0.3)', color: 'var(--gold)',
                      width: '52px', height: '52px', fontSize: '18px'
                    }}>
                      {singer.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'var(--text-display)', fontSize: '14px',
                        color: 'var(--text-primary)', letterSpacing: '0.03em'
                      }}>
                        {singer.name}
                      </div>
                      <div style={{
                        fontFamily: 'var(--text-mono)', fontSize: '10px',
                        color: 'var(--text-dim)', marginTop: '2px', letterSpacing: '0.1em'
                      }}>
                        VERIFIED ARTIST
                      </div>
                    </div>
                  </div>

                  {/* Genre & Fee */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    {singer.genre && <span className="badge badge-gold">{singer.genre}</span>}
                    {singer.booking_fee && (
                      <span className="badge badge-cyan">৳{singer.booking_fee}/show</span>
                    )}
                  </div>

                  {/* Bio */}
                  {singer.bio && (
                    <div style={{
                      fontFamily: 'var(--text-body)', fontSize: '13px',
                      color: 'var(--text-secondary)', lineHeight: 1.6,
                      marginBottom: '14px',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {singer.bio}
                    </div>
                  )}

                  <div style={{
                    fontFamily: 'var(--text-mono)', fontSize: '11px',
                    color: 'var(--gold)', letterSpacing: '0.05em'
                  }}>
                    VIEW PROFILE →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
