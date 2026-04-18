import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // FIX: renamed 'email' → 'identifier' to match backend's expected field name
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.identifier || !form.password) {
      setError('All fields required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      const role = res.data.user?.role;
      if (role === 'admin')          navigate('/dashboard/admin');
      else if (role === 'singer')    navigate('/dashboard/singer');
      else if (role === 'organizer') navigate('/dashboard/organizer');
      else                           navigate('/dashboard/audience');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative grid lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="auth-card fade-in" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px'
          }}>
            ● SYSTEM ACCESS
          </div>
          <div className="auth-title">SWAG se karenge sabka Swagat</div>
          <div className="auth-subtitle">Enter credentials to access GaanBajna</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          {/* FIX: label updated to "Email or Username", name changed to 'identifier' */}
          <label className="form-label">Email or Username</label>
          <input
            className="form-control"
            type="text"
            name="identifier"
            placeholder="user@example.com or username"
            value={form.identifier}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-control"
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Link to="/forgot-password" style={{
            fontFamily: 'var(--text-mono)', fontSize: '11px',
            color: 'var(--text-dim)', letterSpacing: '0.05em'
          }}>
            Forgot password?
          </Link>
        </div>

        <button
          className="btn btn-solid-cyan btn-lg btn-block"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              AUTHENTICATING...
            </>
          ) : (
            '⚡ LOGIN'
          )}
        </button>

        <div className="auth-divider"><span>OR</span></div>

        <div style={{
          fontFamily: 'var(--text-mono)', fontSize: '12px',
          color: 'var(--text-dim)', textAlign: 'center', letterSpacing: '0.05em'
        }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--cyan)' }}>Register here</Link>
        </div>

        {/* Decorative bottom line */}
        <div style={{
          marginTop: '28px', paddingTop: '20px',
          borderTop: 'var(--border-dim)',
          display: 'flex', justifyContent: 'center', gap: '16px'
        }}>
          {['AUDIENCE', 'ARTIST', 'ORGANIZER'].map(role => (
            <span key={role} style={{
              fontFamily: 'var(--text-mono)', fontSize: '9px',
              letterSpacing: '0.12em', color: 'var(--text-dim)',
              padding: '3px 6px', border: 'var(--border-dim)', borderRadius: '3px'
            }}>
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
