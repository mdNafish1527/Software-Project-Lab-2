import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Concerts() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/events')
      .then(res => { setEvents(res.data || []); setFiltered(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = events;
    if (q) result = result.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [search, events]);

  return (
    <div className="page-wrapper">
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px'
          }}>
            Live Event Listings
          </div>
          <div className="flex-between">
            <h1 style={{
              fontFamily: 'var(--text-display)', fontSize: '26px', color: 'var(--cyan)',
              letterSpacing: '0.08em', textShadow: 'var(--cyan-glow)'
            }}>
              CONCERTS
            </h1>
            <span className="badge badge-green">
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', marginRight: '4px' }} />
              {filtered.length} EVENTS
            </span>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            placeholder="Search events, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '360px' }}
          />
          <div className="panel-tabs" style={{
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            background: 'var(--bg-card)', display: 'flex'
          }}>
            {['all', 'this week', 'free'].map(tab => (
              <button key={tab} className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', fontSize: '10px' }}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex-center" style={{ padding: '80px' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon">🎵</div>
              <div className="empty-title">NO EVENTS FOUND</div>
              <div className="empty-sub">Try adjusting your search filters</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {filtered.map(ev => (
              <Link key={ev.id} to={`/concerts/${ev.id}`} style={{ textDecoration: 'none' }}>
                <div className="event-card">
                  {/* Image */}
                  <div style={{
                    height: '160px', background: 'linear-gradient(135deg, #080f1e 0%, #0f1e35 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '52px', position: 'relative', overflow: 'hidden'
                  }}>
                    🎵
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px'
                    }}>
                      <span className="badge badge-green">LIVE</span>
                    </div>
                  </div>

                  <div className="event-card-body">
                    <div className="event-card-title">{ev.title || 'Untitled Event'}</div>
                    <div className="event-card-meta">
                      <span>📍 {ev.venue || ev.location || 'Venue TBD'}</span>
                      <span>📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}</span>
                      {ev.singer_name && <span>🎤 {ev.singer_name}</span>}
                    </div>
                    <div className="flex-between">
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ev.min_price != null && (
                          <span className="badge badge-gold">
                            From ৳{ev.min_price}
                          </span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--cyan)',
                        letterSpacing: '0.05em'
                      }}>
                        VIEW →
                      </span>
                    </div>
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
