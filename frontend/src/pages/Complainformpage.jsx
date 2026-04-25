// frontend/src/pages/ComplaintFormPage.jsx
//
// PUBLIC PAGE — no login required.
//
// Audience scans the organizer's complaint QR code → browser opens:
//   /complaint-form?token=<uuid>
//
// This page:
//   1. Reads the token from the URL
//   2. Calls GET /api/complaint-qr/validate/:token  → gets event details
//   3. Shows a styled complaint form (name + description + up to 5 files)
//   4. Submits to POST /api/complaints/public  (multipart/form-data)

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';

// ── File icon helper ──────────────────────────────────────────────────────────
const fileIcon = (type) =>
  type === 'audio' ? '🎵' : type === 'video' ? '📹' : '📎';

// ── Format date ───────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

export default function ComplaintFormPage() {
  const [searchParams]              = useSearchParams();
  const token                       = searchParams.get('token');

  // Event info loaded from token
  const [event, setEvent]           = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Form state
  const [name, setName]             = useState('');
  const [text, setText]             = useState('');
  const [files, setFiles]           = useState([]);   // { file, preview, type, name, size }
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [formError, setFormError]   = useState('');
  const fileRef                     = useRef();

  // ── Validate token on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenError('No QR token found in the URL. Please scan the QR code again.');
      setLoadingEvent(false);
      return;
    }
    api.get(`/complaint-qr/validate/${token}`)
      .then(res => setEvent(res.data))
      .catch(err =>
        setTokenError(err.response?.data?.message || 'Invalid or expired QR code.')
      )
      .finally(() => setLoadingEvent(false));
  }, [token]);

  // ── File picker ─────────────────────────────────────────────────────────────
  const handleFiles = (e) => {
    const added = Array.from(e.target.files).map(f => {
      const type    = f.type.startsWith('image/') ? 'image'
                    : f.type.startsWith('audio/') ? 'audio'
                    : f.type.startsWith('video/') ? 'video'
                    : 'file';
      const preview = type === 'image' ? URL.createObjectURL(f) : null;
      return { file: f, preview, type, name: f.name, size: f.size };
    });
    setFiles(prev => [...prev, ...added].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => {
      const next = [...prev];
      if (next[idx].preview) URL.revokeObjectURL(next[idx].preview);
      next.splice(idx, 1);
      return next;
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');
    if (!name.trim())
      return setFormError('Please enter your name.');
    if (!text.trim() && files.length === 0)
      return setFormError('Please write a description or attach at least one file.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('token', token);
      fd.append('name',  name.trim());
      if (text.trim()) fd.append('text_content', text.trim());
      files.forEach(f => fd.append('files', f.file));

      await api.post('/complaints/public', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loadingEvent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinnerWrap}>
            <div style={styles.spinner} />
            <p style={styles.dimText}>Verifying QR code…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Token error ─────────────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={styles.heading}>Invalid QR Code</h2>
            <p style={styles.dimText}>{tokenError}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ ...styles.heading, color: '#00BFA6' }}>Complaint Submitted!</h2>
            <p style={{ ...styles.dimText, marginTop: '10px', lineHeight: 1.8 }}>
              Thank you, <strong style={{ color: '#fff' }}>{name}</strong>.<br />
              Your complaint about <strong style={{ color: '#00d4ff' }}>{event?.title}</strong> has
              been received and forwarded to the event organizer and system admin.
            </p>
            <div style={styles.infoBox}>
              ℹ️ Your complaint will be reviewed. You do not need an account to have submitted this.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoText}>🎵 GaanBajna</div>
        <div style={styles.headerSub}>Event Complaint Portal</div>
      </div>

      <div style={styles.card}>

        {/* Event info banner */}
        {event && (
          <div style={styles.eventBanner}>
            {event.poster && (
              <img
                src={event.poster}
                alt={event.title}
                style={styles.eventPoster}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div>
              <div style={styles.eventTitle}>{event.title}</div>
              <div style={styles.eventMeta}>
                📍 {event.venue}{event.city ? `, ${event.city}` : ''}
              </div>
              {event.date && (
                <div style={styles.eventMeta}>📅 {fmtDate(event.date)}</div>
              )}
              <div style={styles.eventMeta}>
                🗂️ Organizer: <span style={{ color: '#00d4ff' }}>{event.organizer_name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Visibility notice */}
        <div style={styles.noticeBox}>
          📢 Your complaint and all attached files will be visible to the{' '}
          <span style={{ color: '#ff8c42', fontWeight: 700 }}>event organizer</span> and the{' '}
          <span style={{ color: '#ff8c42', fontWeight: 700 }}>system admin</span>.
        </div>

        <h2 style={styles.formTitle}>📋 Submit a Complaint</h2>

        {formError && <div style={styles.errorBox}>⚠️ {formError}</div>}

        {/* Name */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Your Name <span style={styles.required}>*</span></label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <p style={styles.hint}>No account needed — just your name so the organizer can follow up.</p>
        </div>

        {/* Description */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            style={{ ...styles.input, minHeight: '120px', resize: 'vertical' }}
            placeholder="Describe your complaint — sound issues, safety concerns, staff behaviour, facilities…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        {/* File upload */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            Attachments{' '}
            <span style={styles.hint}>
              up to 5 files · images, audio, video (max 50 MB each)
            </span>
          </label>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*"
            onChange={handleFiles}
            style={{ display: 'none' }}
          />

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current.click()}
            style={styles.dropZone}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dt = e.dataTransfer;
              if (dt.files) handleFiles({ target: dt, files: dt.files });
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
            <div style={{ fontSize: '14px', color: '#aaa' }}>
              Click or drag &amp; drop files here
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {files.length}/5 files selected
            </div>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div style={styles.fileGrid}>
              {files.map((f, i) => (
                <div key={i} style={styles.fileCard}>
                  {f.type === 'image' && f.preview ? (
                    <img
                      src={f.preview}
                      alt={f.name}
                      style={styles.fileThumb}
                    />
                  ) : (
                    <div style={styles.fileIconBox}>
                      <span style={{ fontSize: '28px' }}>{fileIcon(f.type)}</span>
                      <span style={styles.fileCardName}>{f.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    style={styles.removeBtn}
                    title="Remove"
                  >✕</button>
                  <div style={styles.fileCardLabel}>
                    {f.type.toUpperCase()} · {(f.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || (!name.trim() && !text.trim() && files.length === 0)}
          style={{
            ...styles.submitBtn,
            opacity: submitting ? 0.6 : 1,
            cursor:  submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '⏳ Submitting…' : '📨 Submit Complaint'}
        </button>

      </div>

      {/* Footer */}
      <div style={styles.footer}>
        GaanBajna · Secure Complaint Portal · All files handled confidentially
      </div>
    </div>
  );
}

// ── Inline styles (no external CSS dependency — works standalone) ─────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #040810 0%, #0a1624 60%, #040810 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 16px 40px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#e0e0e0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    paddingTop: '16px',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#D4A853',
    letterSpacing: '0.1em',
    textShadow: '0 0 20px rgba(212,168,83,0.4)',
  },
  headerSub: {
    fontSize: '12px',
    color: '#888',
    letterSpacing: '0.12em',
    marginTop: '4px',
    textTransform: 'uppercase',
  },
  card: {
    background: '#0d1b2a',
    border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '16px',
    padding: '28px 24px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  spinnerWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    gap: '16px',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(0,212,255,0.2)',
    borderTop: '3px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  eventBanner: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    background: 'rgba(212,168,83,0.06)',
    border: '1px solid rgba(212,168,83,0.2)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '18px',
  },
  eventPoster: {
    width: '70px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '8px',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#D4A853',
    marginBottom: '6px',
    letterSpacing: '0.02em',
  },
  eventMeta: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '3px',
  },
  noticeBox: {
    background: 'rgba(255,82,82,0.06)',
    border: '1px solid rgba(255,82,82,0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#ccc',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  infoBox: {
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#aaa',
    lineHeight: 1.6,
    marginTop: '16px',
  },
  formTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#FF5252',
    marginBottom: '20px',
    letterSpacing: '0.02em',
  },
  errorBox: {
    background: 'rgba(255,82,82,0.1)',
    border: '1px solid rgba(255,82,82,0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#FF5252',
    fontSize: '13px',
    marginBottom: '16px',
  },
  fieldGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#aaa',
    marginBottom: '8px',
  },
  required: {
    color: '#FF5252',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    background: '#040810',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '11px',
    color: '#666',
    marginTop: '5px',
  },
  dropZone: {
    border: '2px dashed rgba(0,212,255,0.2)',
    borderRadius: '12px',
    padding: '28px',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'rgba(0,212,255,0.02)',
    transition: 'border-color 0.2s, background 0.2s',
  },
  fileGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '14px',
  },
  fileCard: {
    position: 'relative',
    width: '130px',
    background: '#0a1624',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  fileThumb: {
    width: '130px',
    height: '85px',
    objectFit: 'cover',
    display: 'block',
  },
  fileIconBox: {
    width: '130px',
    height: '85px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '8px',
    boxSizing: 'border-box',
  },
  fileCardName: {
    fontSize: '9px',
    color: '#888',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '110px',
  },
  fileCardLabel: {
    fontSize: '9px',
    color: '#555',
    textAlign: 'center',
    padding: '3px 6px',
    background: 'rgba(0,0,0,0.4)',
  },
  removeBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(0,0,0,0.75)',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  submitBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #FF5252, #c62828)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  heading: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: '10px',
  },
  dimText: {
    fontSize: '14px',
    color: '#888',
  },
  footer: {
    marginTop: '28px',
    fontSize: '11px',
    color: '#444',
    textAlign: 'center',
    letterSpacing: '0.05em',
  },
};
