import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';

const ROLES = [
  { key: 'audience', label: '🎧 Audience', desc: 'Discover & attend concerts, buy tickets and merch' },
  { key: 'singer', label: '🎤 Singer', desc: 'Showcase your talent, get booked for events' },
  { key: 'organizer', label: '🎪 Organizer', desc: 'Host amazing events and manage concerts' },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm: '', profile_picture: ''
  });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(''); // shown on screen in dev mode
  const [emailUsed, setEmailUsed] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (r) => { setRole(r); setStep(2); };

  const validate = () => {
    if (!form.username || !form.email || !form.password) return 'All fields are required';
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (['singer', 'organizer'].includes(role) && !form.profile_picture)
      return 'Profile picture URL is required for Singer/Organizer';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setLoading(true);
    try {
      const res = await API.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role,
        profile_picture: form.profile_picture || null,
      });
      setEmailUsed(form.email);
      // Show OTP on screen if returned (dev mode)
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
      setStep(3);
      toast.info('OTP sent! Check your email or look at the box below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await API.post('/auth/verify-otp', { email: emailUsed, otp });
      toast.success(res.data.message);
      if (res.data.status === 'active') navigate('/login');
      else navigate('/register/pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await API.post('/auth/resend-otp', { email: emailUsed });
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
      toast.info('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: step === 1 ? 560 : 460 }}>
        <div className="auth-logo">
          <h1>🎵 GaanBajna</h1>
          <p>Create your account</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {['Choose Role', 'Your Details', 'Verify Email'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--gold)' : 'var(--bg3)',
                  color: step >= i + 1 ? '#000' : 'var(--muted)',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>
              What best describes you?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map(r => (
                <button key={r.key} onClick={() => handleRoleSelect(r.key)} style={{
                  background: 'var(--bg3)', border: '2px solid var(--border)', borderRadius: 12,
                  padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s', color: 'var(--text)', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 20, fontSize: 14 }}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button type="button" onClick={() => setStep(1)} style={{
                background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20
              }}>←</button>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                Registering as <strong style={{ color: 'var(--gold)', textTransform: 'capitalize' }}>{role}</strong>
              </span>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input className="form-control" placeholder="your_username" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="Minimum 8 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type="password" placeholder="Repeat your password"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            {['singer', 'organizer'].includes(role) && (
              <div className="form-group">
                <label>Profile Picture URL <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className="form-control" placeholder="https://example.com/photo.jpg"
                  value={form.profile_picture}
                  onChange={e => setForm({ ...form, profile_picture: e.target.value })} />
                <small style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Required. Paste a direct image URL (e.g. from imgur, cloudinary)
                </small>
              </div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>
        )}

        {/* Step 3: OTP Verification */}
        {step === 3 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📧</div>
              <p style={{ color: 'var(--muted)' }}>We sent a 6-digit OTP to</p>
              <p style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.05rem' }}>{emailUsed}</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                Valid for <strong>5 minutes</strong>
              </p>
            </div>

            {/* Dev OTP hint box */}
            {devOtp && (
              <div style={{
                background: 'rgba(46,204,113,0.08)', border: '1.5px solid rgba(46,204,113,0.4)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 18, textAlign: 'center'
              }}>
                <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>
                  🛠️ Dev Mode — Your OTP is:
                </p>
                <p style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: 12, color: '#2ecc71' }}>
                  {devOtp}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>
                  (Also printed in your backend terminal)
                </p>
              </div>
            )}

            <div className="form-group">
              <label>Enter OTP</label>
              <input className="form-control" placeholder="123456" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: 14, fontWeight: 700 }}
                autoFocus />
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Verifying...' : '✓ Verify & Continue'}
            </button>

            <button type="button" onClick={handleResendOTP}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13,
                cursor: 'pointer', marginTop: 14, display: 'block', textAlign: 'center', width: '100%'
              }}>
              Didn't receive the OTP? <span style={{ color: 'var(--gold)' }}>Resend</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
