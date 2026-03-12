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
    role: '', username: '', email: '', password: '', confirmPassword: '', otp: ''
  });
  // FIX #3: track profile picture as base64 string
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);   // step 3 success state
  const [verifiedStatus, setVerifiedStatus] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRoleSelect = role => {
    setForm({ ...form, role });
    setError('');
  };

  // FIX #3: convert uploaded image to base64 so it can be sent in JSON body
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicture(reader.result);
    reader.readAsDataURL(file);
  };

  const handleStep1Next = () => {
    if (!form.role) { setError('Please select a role.'); return; }
    setError(''); setStep(2);
  };

  const handleStep2Next = async () => {
    // FIX #1: check 'username' instead of 'name'
    if (!form.username || !form.email || !form.password) { setError('All fields required.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    // FIX #2: backend requires >= 8 characters, not 6
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    // FIX #3: require profile picture for singer/organizer
    if (['singer', 'organizer'].includes(form.role) && !profilePicture) {
      setError('Profile picture is required for Artist/Organizer.'); return;
    }

    setLoading(true); setError('');
    try {
      // FIX #1: send 'username' (not 'name') to match backend's expected field
      // FIX #3: send 'profile_picture' for singer/organizer
      await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        profile_picture: profilePicture || null,
      });
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
      const res = await api.post('/auth/verify-otp', { email: form.email, otp: form.otp });
      const status = res.data?.status;
      setVerifiedStatus(status);
      setVerified(true);
      // Audience is active immediately — redirect to login after 2 seconds
      if (status === 'active') {
        setTimeout(() => navigate('/login'), 2000);
      }
      // Singer/Organizer stay pending — no redirect, show waiting message
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
            {/* FIX #1: field renamed from 'name' → 'username' to match backend */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" name="username" placeholder="Your unique username"
                value={form.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" placeholder="user@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              {/* FIX #2: updated placeholder to say Min 8 characters */}
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" placeholder="Min 8 characters"
                value={form.password} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="confirmPassword" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange} />
            </div>

            {/* FIX #3: show profile picture upload for singer/organizer */}
            {['singer', 'organizer'].includes(form.role) && (
              <div className="form-group">
                <label className="form-label">Profile Picture <span style={{ color: 'var(--cyan)' }}>*</span></label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  style={{ padding: '8px' }}
                />
                {profilePicture && (
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img
                      src={profilePicture}
                      alt="Preview"
                      style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--cyan)' }}
                    />
                  </div>
                )}
              </div>
            )}

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
            {/* ── Success: Audience (active immediately) ── */}
            {verified && verifiedStatus === 'active' && (
              <div style={{
                padding: '24px', background: 'rgba(0,255,100,0.05)',
                border: '1px solid rgba(0,255,100,0.3)', borderRadius: 'var(--radius-sm)',
                textAlign: 'center', fontFamily: 'var(--text-mono)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                <div style={{ color: '#00ff64', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  EMAIL VERIFIED!
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                  Your account is active. Redirecting to login...
                </div>
              </div>
            )}

            {/* ── Success: Singer/Organizer (pending admin approval) ── */}
            {verified && verifiedStatus === 'pending' && (
              <div style={{
                padding: '24px', background: 'var(--cyan-dim)',
                border: '1px solid rgba(0,212,255,0.3)', borderRadius: 'var(--radius-sm)',
                textAlign: 'center', fontFamily: 'var(--text-mono)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <div style={{ color: 'var(--cyan)', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  EMAIL VERIFIED!
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.7' }}>
                  Your account is <strong style={{ color: 'var(--cyan)' }}>pending admin approval</strong>.<br />
                  We will notify you at <strong>{form.email}</strong> once approved.<br /><br />
                  <span style={{ fontSize: '10px' }}>This usually takes 24–48 hours.</span>
                </div>
                <button
                  className="btn btn-ghost btn-lg"
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={() => navigate('/login')}
                >
                  ← Back to Login
                </button>
              </div>
            )}

            {/* ── OTP input form (before verification) ── */}
            {!verified && (
              <>
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
              </>
            )}
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
