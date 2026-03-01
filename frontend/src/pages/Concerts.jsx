import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

const Concerts = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const fetchEvents = () => {
    setLoading(true);
    API.get('/events', { params: { search, city } })
      .then(r => { setEvents(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 36 }}>
          <h1 className="section-title">Live Concerts</h1>
          <p className="section-sub">Upcoming events across Bangladesh</p>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input className="form-control" placeholder="Search concerts..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <input className="form-control" placeholder="City..." value={city}
            onChange={e => setCity(e.target.value)} style={{ maxWidth: 160 }} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <div className="spinner" />
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎭</div>
            <h3>No concerts found</h3>
            <p>Try a different search or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {events.map(e => (
              <Link to={`/concerts/${e.event_id}`} key={e.event_id} style={{ textDecoration: 'none' }}>
                <div className="card event-card">
                  <div style={{
                    height: 180,
                    background: e.poster
                      ? `url(${e.poster}) center/cover`
                      : 'linear-gradient(135deg, #1a0e00, #2a1a00)',
                    position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span className="badge badge-green">🟢 Live</span>
                    </div>
                    {e.dynamic_pricing_enable && (
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <span className="badge badge-gold">⚡ Dynamic</span>
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{e.title}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
                      🎤 {e.singer_name}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
                      📍 {e.venue}, {e.city}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
                      📅 {new Date(e.date).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="tier-prices">
                      {e.tier1_price && <span className="tier-pill">T1: ৳{e.tier1_price}</span>}
                      {e.tier2_price && <span className="tier-pill">T2: ৳{e.tier2_price}</span>}
                      {e.tier3_price && <span className="tier-pill">T3: ৳{e.tier3_price}</span>}
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
};

export default Concerts;