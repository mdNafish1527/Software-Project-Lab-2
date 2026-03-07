import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { setError('Enter your email.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) { setError('All fields required.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
      setSuccess('Password reset successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--text-mono)', fontSize: '10px', letterSpacing: '0.2em',
            color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px'
          }}>
            ● ACCOUNT RECOVERY
          </div>
          <div className="auth-title" style={{ color: 'var(--gold)', textShadow: 'var(--gold-glow)' }}>
            RESET PASSWORD
          </div>
          <div className="auth-subtitle">
            {step === 1 && 'Enter your registered email address'}
            {step === 2 && 'Enter the OTP and your new password'}
            {step === 3 && 'Account recovered successfully'}
          </div>
        </div>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" placeholder="user@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-solid-gold btn-lg btn-block" onClick={handleSendOtp} disabled={loading}>
              {loading ? 'SENDING...' : '📧 SEND OTP'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input className="form-control" placeholder="6-digit code"
                value={otp} onChange={e => setOtp(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.4em' }} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" placeholder="Min 6 characters"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" placeholder="Repeat password"
                value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            <button className="btn btn-solid-gold btn-lg btn-block" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'RESETTING...' : '⚡ RESET PASSWORD'}
            </button>
          </>
        )}

        {step === 3 && (
          <Link to="/login" className="btn btn-solid-cyan btn-lg btn-block" style={{ textAlign: 'center' }}>
            ← BACK TO LOGIN
          </Link>
        )}

        <div className="auth-divider"><span>REMEMBER IT</span></div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--text-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
          <Link to="/login" style={{ color: 'var(--cyan)' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
