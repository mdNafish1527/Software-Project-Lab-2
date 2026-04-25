// backend/routes/complaints.js
//
// Complaint routes:
//
//  POST /api/complaints/public          — NO auth — submit via QR token (new flow)
//  POST /api/complaints                 — authenticated audience (existing flow)
//  GET  /api/complaints/mine            — audience views own complaints
//  GET  /api/complaints/organizer/all   — organizer views complaints for their events
//  GET  /api/complaints/admin/all       — admin views all complaints (with ?status= filter)
//  PUT  /api/complaints/:id/status      — admin updates status + note

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload, fileCategory, fileUrl, multerErrorHandler } = require('../middleware/upload');

// ── Helper: safely parse media JSON field ─────────────────────────────────────
// MySQL JSON columns arrive already-parsed in Node; guard against both cases.
function parseMedia(raw) {
  if (!raw)                  return [];
  if (Array.isArray(raw))    return raw;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints/public
// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — no login required.
// Audience submits a complaint after scanning the organizer's complaint QR.
//
// Body (multipart/form-data):
//   token        — UUID from EVENT_COMPLAINT_QR (required)
//   name         — submitter's name (required, free text — no account needed)
//   text_content — complaint description (optional if files provided)
//   files[]      — up to 5 media files (optional)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/public',
  upload.array('files', 5),
  async (req, res) => {
    try {
      const { token, name, text_content } = req.body;

      if (!token)
        return res.status(400).json({ message: 'QR token is required' });

      if (!name?.trim())
        return res.status(400).json({ message: 'Your name is required' });

      if (!text_content?.trim() && (!req.files || req.files.length === 0))
        return res.status(400).json({
          message: 'Please provide a description or attach at least one file',
        });

      // Validate token → get event
      const [qrRows] = await db.query(
        `SELECT ecq.event_id, e.status AS event_status, e.title
         FROM EVENT_COMPLAINT_QR ecq
         JOIN \`EVENT\` e ON ecq.event_id = e.event_id
         WHERE ecq.token = ?`,
        [token]
      );

      if (!qrRows.length)
        return res.status(404).json({ message: 'Invalid complaint QR code' });

      const { event_id, event_status } = qrRows[0];

      if (!['live', 'ended'].includes(event_status))
        return res.status(403).json({
          message: 'Complaints can only be submitted for live or ended events',
        });

      // Build media array from uploaded files
      const media = (req.files || []).map(f => ({
        type: fileCategory(f.mimetype),
        url:  fileUrl(req, f.filename),
        name: f.originalname,
        size: f.size,
      }));

      // Insert — buyer_id is NULL for public (anonymous) submissions
      // We store the submitter's name in text_content prefixed, OR you can
      // add a `submitter_name` column; here we store it as a JSON note.
      const [result] = await db.query(
        `INSERT INTO \`COMPLAINT\`
           (event_id, buyer_id, text_content, media, status)
         VALUES (?, NULL, ?, ?, 'pending')`,
        [
          event_id,
          // Prefix the free-text name so dashboards can display it
          `[${name.trim()}] ${text_content?.trim() || ''}`.trim(),
          media.length ? JSON.stringify(media) : null,
        ]
      );

      res.status(201).json({
        message:      'Complaint submitted successfully',
        complaint_id: result.insertId,
      });
    } catch (err) {
      console.error('POST /complaints/public:', err.message);
      res.status(500).json({ message: err.message || 'Failed to submit complaint' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/complaints
// Authenticated audience — submits after their ticket has been scanned (used=1).
// (Existing flow — kept intact, just uses shared upload middleware now.)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  upload.array('files', 5),
  async (req, res) => {
    try {
      const { event_id, text_content } = req.body;

      if (!event_id)
        return res.status(400).json({ message: 'event_id is required' });

      if (!text_content?.trim() && (!req.files || req.files.length === 0))
        return res.status(400).json({
          message: 'Please provide a description or attach at least one file',
        });

      // Verify event exists
      const [eventRows] = await db.query(
        'SELECT event_id, organizer_id FROM `EVENT` WHERE event_id = ?',
        [event_id]
      );
      if (!eventRows.length)
        return res.status(404).json({ message: 'Event not found' });

      // Verify buyer has a scanned ticket
      const [ticketRows] = await db.query(
        'SELECT ticket_id, used FROM `TICKET` WHERE event_id = ? AND buyer_id = ? LIMIT 1',
        [event_id, req.user.u_id]
      );
      if (!ticketRows.length)
        return res.status(403).json({
          message: 'You must have a ticket for this event to submit a complaint',
        });
      if (!ticketRows[0].used)
        return res.status(403).json({
          message: 'Your ticket must be scanned at the event before you can submit a complaint',
        });

      // One complaint per event per user
      const [existing] = await db.query(
        'SELECT complaint_id FROM `COMPLAINT` WHERE event_id = ? AND buyer_id = ? LIMIT 1',
        [event_id, req.user.u_id]
      );
      if (existing.length)
        return res.status(409).json({
          message: 'You have already submitted a complaint for this event',
        });

      const media = (req.files || []).map(f => ({
        type: fileCategory(f.mimetype),
        url:  fileUrl(req, f.filename),
        name: f.originalname,
        size: f.size,
      }));

      const [result] = await db.query(
        `INSERT INTO \`COMPLAINT\` (event_id, buyer_id, text_content, media, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [
          event_id,
          req.user.u_id,
          text_content?.trim() || null,
          media.length ? JSON.stringify(media) : null,
        ]
      );

      res.status(201).json({
        message:      'Complaint submitted successfully',
        complaint_id: result.insertId,
      });
    } catch (err) {
      console.error('POST /complaints:', err.message);
      res.status(500).json({ message: err.message || 'Failed to submit complaint' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaints/mine  — audience views their own complaints
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         c.complaint_id, c.event_id, c.text_content, c.media,
         c.status, c.admin_note, c.created_at,
         e.title AS event_title
       FROM \`COMPLAINT\` c
       JOIN \`EVENT\` e ON c.event_id = e.event_id
       WHERE c.buyer_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.u_id]
    );
    res.json(rows.map(r => ({ ...r, media: parseMedia(r.media) })));
  } catch (err) {
    console.error('GET /complaints/mine:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaints/organizer/all
// Organizer views all complaints for their events (includes media).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/organizer/all', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         c.complaint_id, c.event_id, c.text_content, c.media,
         c.status, c.admin_note, c.created_at,
         e.title              AS event_title,
         u.unique_username    AS reporter_name,
         u.profile_picture    AS reporter_pic
       FROM \`COMPLAINT\` c
       JOIN \`EVENT\` e ON c.event_id = e.event_id
       -- LEFT JOIN so anonymous (buyer_id = NULL) complaints still appear
       LEFT JOIN \`USER\` u ON c.buyer_id = u.u_id
       WHERE e.organizer_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.u_id]
    );
    res.json(rows.map(r => ({ ...r, media: parseMedia(r.media) })));
  } catch (err) {
    console.error('GET /complaints/organizer/all:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/complaints/admin/all  — admin views all complaints system-wide
// Optional query param: ?status=pending|reviewed|resolved|dismissed
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const where  = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];

    const [rows] = await db.query(
      `SELECT
         c.complaint_id, c.event_id, c.text_content, c.media,
         c.status, c.admin_note, c.created_at,
         e.title              AS event_title,
         u.unique_username    AS reporter_name,
         u.profile_picture    AS reporter_pic,
         org.unique_username  AS organizer_name
       FROM \`COMPLAINT\` c
       JOIN  \`EVENT\`  e   ON c.event_id    = e.event_id
       LEFT JOIN \`USER\` u ON c.buyer_id    = u.u_id
       LEFT JOIN \`USER\` org ON e.organizer_id = org.u_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows.map(r => ({ ...r, media: parseMedia(r.media) })));
  } catch (err) {
    console.error('GET /complaints/admin/all:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/status  — admin updates status + optional note
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const VALID = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!VALID.includes(status))
      return res.status(400).json({ message: `status must be one of: ${VALID.join(', ')}` });

    const [result] = await db.query(
      'UPDATE `COMPLAINT` SET status = ?, admin_note = ? WHERE complaint_id = ?',
      [status, admin_note || null, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Complaint not found' });

    res.json({ message: 'Complaint updated' });
  } catch (err) {
    console.error('PUT /complaints/:id/status:', err.message);
    res.status(500).json({ message: 'Failed to update complaint' });
  }
});

// ── Multer / general error handler ───────────────────────────────────────────
router.use(multerErrorHandler);

module.exports = router;
