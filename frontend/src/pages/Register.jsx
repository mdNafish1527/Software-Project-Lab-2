import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const ROLES = [
  { value: 'audience',  label: 'Audience',  icon: '👥', desc: 'Buy tickets, attend events, rate experiences' },
  { value: 'singer',    label: 'Artist',     icon: '🎤', desc: 'Accept bookings, manage merch, build your brand' },
  { value: 'organizer', label: 'Organizer',  icon: '🎪', desc: 'Host concerts, book artists, manage venues' },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    role: '', name: '', email: '', password: '', confirmPassword: '', otp: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleSelect = role => {
    setForm({ ...form, role });
    setError('');
  };

  const handleStep1Next = () => {
    if (!form.role) { setError('Please select a role.'); return; }
    setError(''); setStep(2);
  };

  const handleStep2Next = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, role: form.role });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp) { setError('Enter the OTP sent to your email.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email: form.email, otp: form.otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: form.email });
      setError('');
    } catch (err) {
      setError('Could not resend OTP.');
    }
  };

  return (
    <div className="auth-page">
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="auth-card fade-in" style={{ maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px'
          }}>
            ● NEW USER REGISTRATION
          </div>
          <div className="auth-title">CREATE ACCOUNT</div>
        </div>

        {/* Step Indicator */}
        <div className="steps" style={{ marginBottom: '28px' }}>
          {[
            { n: 1, label: 'Role' },
            { n: 2, label: 'Details' },
            { n: 3, label: 'Verify' },
          ].map((s, i) => (
            <div key={s.n} className="step" style={{ flex: i < 2 ? '1' : 'unset' }}>
              <div className={`step-circle ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}>
                {step > s.n ? '✓' : s.n}
              </div>
              {i < 2 && <div className={`step-line ${step > s.n ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── STEP 1: Role ── */}
        {step === 1 && (
          <div>
            <div style={{
              fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.15em',
              color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '14px'
            }}>
              Select your role
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {ROLES.map(r => (
                <div key={r.value}
                  onClick={() => handleRoleSelect(r.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    border: form.role === r.value
                      ? '1px solid var(--cyan)'
                      : '1px solid rgba(255,255,255,0.08)',
                    background: form.role === r.value
                      ? 'var(--cyan-dim)'
                      : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'var(--transition)'
                  }}>
                  <div style={{ fontSize: '24px' }}>{r.icon}</div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--text-mono)', fontSize: '12px',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: form.role === r.value ? 'var(--cyan)' : 'var(--text-primary)',
                      marginBottom: '3px'
                    }}>
                      {r.label}
                    </div>
                    <div style={{ fontFamily: 'var(--text-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                      {r.desc}
                    </div>
                  </div>
                  {form.role === r.value && (
                    <div style={{ marginLeft: 'auto', color: 'var(--cyan)', fontSize: '16px' }}>●</div>
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-solid-cyan btn-lg btn-block" onClick={handleStep1Next}>
              CONTINUE →
            </button>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="name" placeholder="Your full name"
                value={form.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" placeholder="user@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="confirmPassword" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>
                ← BACK
              </button>
              <button className="btn btn-solid-cyan btn-lg" style={{ flex: 2 }} onClick={handleStep2Next} disabled={loading}>
                {loading ? 'REGISTERING...' : 'REGISTER →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: OTP ── */}
        {step === 3 && (
          <div>
            <div style={{
              padding: '14px', background: 'var(--cyan-dim)',
              border: '1px solid rgba(0,212,255,0.2)', borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--cyan)',
              marginBottom: '20px', letterSpacing: '0.05em'
            }}>
              ● OTP sent to {form.email}
            </div>
            <div className="form-group">
              <label className="form-label">Verification OTP</label>
              <input className="form-control" name="otp" placeholder="Enter 6-digit code"
                value={form.otp} onChange={handleChange}
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.4em' }} />
            </div>
            <button className="btn btn-solid-cyan btn-lg btn-block" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'VERIFYING...' : '⚡ VERIFY & ACTIVATE'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button onClick={handleResendOtp} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)',
                letterSpacing: '0.05em'
              }}>
                Resend OTP →
              </button>
            </div>
          </div>
        )}

        <div className="auth-divider"><span>HAVE ACCOUNT</span></div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
          <Link to="/login" style={{ color: 'var(--cyan)' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
