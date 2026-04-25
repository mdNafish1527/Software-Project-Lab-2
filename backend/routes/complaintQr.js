// backend/routes/complaintQr.js
//
// Manages per-event complaint QR codes.
//
// Routes:
//   POST /api/complaint-qr/:eventId/generate   — organizer generates/fetches QR
//   GET  /api/complaint-qr/validate/:token     — public: validates token, returns event info
//
// The QR encodes a public URL:  <FRONTEND_URL>/complaint-form?token=<uuid>
// That page lets an audience member submit a complaint WITHOUT being logged in.

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const QRCode  = require('qrcode');          // already in package.json
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ── Env: front-end origin (set FRONTEND_URL in .env, e.g. http://localhost:3000) ──
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaint-qr/:eventId/generate
// Organizer calls this to get (or create) the complaint QR for their event.
// Returns the QR as a base64 PNG data URL so the organizer can display/print it.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/:eventId/generate',
  authenticate,
  requireRole('organizer'),
  async (req, res) => {
    try {
      const { eventId } = req.params;

      // Verify the event belongs to this organizer
      const [evRows] = await db.query(
        'SELECT event_id, title FROM `EVENT` WHERE event_id = ? AND organizer_id = ?',
        [eventId, req.user.u_id]
      );
      if (!evRows.length)
        return res.status(404).json({ message: 'Event not found or not yours' });

      // Check if a QR already exists
      const [existing] = await db.query(
        'SELECT token, qr_image FROM EVENT_COMPLAINT_QR WHERE event_id = ?',
        [eventId]
      );

      if (existing.length) {
        // Return the already-generated QR
        return res.json({
          token:    existing[0].token,
          qr_image: existing[0].qr_image,
          url:      `${FRONTEND_URL}/complaint-form?token=${existing[0].token}`,
        });
      }

      // Generate a new UUID token
      const token = crypto.randomUUID();
      const url   = `${FRONTEND_URL}/complaint-form?token=${token}`;

      // Render QR to base64 PNG
      const qr_image = await QRCode.toDataURL(url, {
        width:          300,
        margin:         2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      // Persist
      await db.query(
        'INSERT INTO EVENT_COMPLAINT_QR (event_id, token, qr_image) VALUES (?, ?, ?)',
        [eventId, token, qr_image]
      );

      res.status(201).json({ token, qr_image, url });
    } catch (err) {
      console.error('POST /complaint-qr/:eventId/generate:', err.message);
      res.status(500).json({ message: 'Failed to generate QR code' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaint-qr/validate/:token
// PUBLIC — no authentication required.
// The complaint form page calls this on load to get event details from the token.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await db.query(
      `SELECT
         ecq.token,
         e.event_id,
         e.title,
         e.venue,
         e.city,
         e.date,
         e.time,
         e.poster,
         e.status   AS event_status,
         u.unique_username AS organizer_name
       FROM EVENT_COMPLAINT_QR ecq
       JOIN \`EVENT\` e ON ecq.event_id = e.event_id
       JOIN \`USER\`  u ON e.organizer_id = u.u_id
       WHERE ecq.token = ?`,
      [token]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'Invalid or expired complaint QR code' });

    const ev = rows[0];

    // Only allow complaints for live or ended events
    if (!['live', 'ended'].includes(ev.event_status))
      return res.status(403).json({
        message: 'Complaints can only be submitted for live or ended events',
      });

    res.json({
      event_id:       ev.event_id,
      title:          ev.title,
      venue:          ev.venue,
      city:           ev.city,
      date:           ev.date,
      time:           ev.time,
      poster:         ev.poster,
      organizer_name: ev.organizer_name,
    });
  } catch (err) {
    console.error('GET /complaint-qr/validate/:token:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;