import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const emailFromLink = searchParams.get('email') || '';

  const [form, setForm] = useState({
    username: '',
    email: emailFromLink,
    password: '',
    confirmPassword: '',
  });

  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');

    if (!token) {
      setAlert('Invalid invitation link. Token is missing.');
      return;
    }

    if (!form.username || !form.email || !form.password) {
      setAlert('Username, email and password are required.');
      return;
    }

    if (form.password.length < 8) {
      setAlert('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setAlert('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/auth/register-admin', {
        token,
        username: form.username,
        email: form.email,
        password: form.password,
      });

      alert('Admin account created successfully. Please login.');
      navigate('/login');
    } catch (err) {
      setAlert(err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div
        className="main-content"
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          paddingTop: '60px',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--text-mono)',
              fontSize: '10px',
              color: 'var(--gold)',
              letterSpacing: '0.15em',
              marginBottom: '8px',
            }}
          >
            ADMIN INVITATION
          </div>

          <h1
            style={{
              fontFamily: 'var(--text-display)',
              fontSize: '24px',
              marginBottom: '20px',
            }}
          >
            Create Admin Account
          </h1>

          {alert && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {alert}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="Enter admin username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-control"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Confirm password"
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? 'Creating...' : 'Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}