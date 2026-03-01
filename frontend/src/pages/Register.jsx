import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';

const ROLES = [
  { key: 'audience', label: '🎧 Audience', desc: 'Discover & attend concerts' },
  { key: 'singer', label: '🎤 Singer', desc: 'Showcase your talent' },
  { key: 'organizer', label: '🎪 Organizer', desc: 'Host amazing events' },
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=role, 2=details, 3=otp
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', profile_picture: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleRoleSelect = (r) => { setRole(r); setStep(2); };

  const validate = () => {
    if (!form.username || !form.email || !form.password) return 'All fields are required';
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (['singer', 'organizer'].includes(role) && !form.profile_picture) return 'Profile picture URL is required';
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setLoading(true);
    try {
      await API.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
        role,
        profile_picture: form.profile_picture || null,
      });
      setEmail(form.email);
      setStep(3);
      toast.info('OTP sent to your email!');
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
      const res = await API.post('/auth/verify-otp', { email, otp });
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
      await API.post('/auth/resend-otp', { email });
      toast.info('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: step === 1 ? 580 : 440 }}>
        <div className="auth-logo">
          <h1>🎵 GaanBajna</h1>
          <p>Create your account</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {['Role', 'Details', 'Verify'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--gold)' : 'var(--bg3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: step >= i + 1 ? '#000' : 'var(--muted)',
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--border)' }}>—</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: 20, textAlign: 'center' }}>Choose your role to get started</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ROLES.map(r => (
                <button key={r.key} onClick={() => handleRoleSelect(r.key)} style={{
                  background: 'var(--bg3)', border: '2px solid var(--border)', borderRadius: 12,
                  padding: '16px 20px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)',
                  color: 'var(--text)', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{r.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 20, fontSize: 14 }}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Details form */}
        {step === 2 && (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>←</button>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>Registering as <strong style={{ color: 'var(--gold)' }}>{role}</strong></span>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input className="form-control" placeholder="unique_username" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" placeholder="you@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="form-control" type="password" placeholder="Min 8 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input className="form-control" type="password" placeholder="Repeat password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} />
            </div>
            {['singer', 'organizer'].includes(role) && (
              <div className="form-group">
                <label>Profile Picture URL *</label>
                <input className="form-control" placeholder="https://..." value={form.profile_picture}
                  onChange={e => setForm({ ...form, profile_picture: e.target.value })} />
                <small style={{ color: 'var(--muted)', fontSize: 12 }}>Required for singers and organizers</small>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Registering...' : 'Create Account →'}
            </button>
          </form>
        )}

        {/* Step 3: OTP */}
        {step === 3 && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📧</div>
              <p style={{ color: 'var(--muted)' }}>We sent a 6-digit OTP to</p>
              <p style={{ fontWeight: 700, color: 'var(--gold)' }}>{email}</p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Valid for 5 minutes</p>
            </div>
            <div className="form-group">
              <label>OTP Code</label>
              <input className="form-control" placeholder="123456" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: 12 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button type="button" onClick={handleResendOTP} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginTop: 12, display: 'block', textAlign: 'center', width: '100%' }}>
              Didn't receive? Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;