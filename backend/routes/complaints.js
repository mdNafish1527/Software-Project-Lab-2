const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── Multer setup ─────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/complaints');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  'image/jpeg','image/png','image/gif','image/webp',
  'audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/webm',
  'video/mp4','video/webm','video/ogg','video/quicktime',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
                   .replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${file.mimetype}`)),
});

const fileType = (mime) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
};

const fileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/complaints/${filename}`;

// ─────────────────────────────────────────────────────────────
// POST /api/complaints
// KEY RULE: user can only complain AFTER their ticket has been
//           scanned (used = 1) at the venue.
// ─────────────────────────────────────────────────────────────
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
        return res.status(400).json({ message: 'Please provide a description or attach media' });

      // Verify event exists
      const [eventRows] = await db.query(
        'SELECT event_id, organizer_id FROM `EVENT` WHERE event_id = ?',
        [event_id]
      );
      if (!eventRows.length)
        return res.status(404).json({ message: 'Event not found' });

      // Check if user has a ticket for this event
      const [ticketRows] = await db.query(
        'SELECT ticket_id, used FROM `TICKET` WHERE event_id = ? AND buyer_id = ? LIMIT 1',
        [event_id, req.user.u_id]
      );

      if (!ticketRows.length)
        return res.status(403).json({
          message: 'You must have a ticket for this event to submit a complaint',
        });

      // KEY CHECK: ticket must have been scanned (used = 1)
      if (!ticketRows[0].used)
        return res.status(403).json({
          message: 'Your ticket must be scanned at the event before you can submit a complaint',
        });

      // Check for duplicate complaint from same user for same event
      const [existing] = await db.query(
        'SELECT complaint_id FROM `COMPLAINT` WHERE event_id = ? AND buyer_id = ? LIMIT 1',
        [event_id, req.user.u_id]
      );
      if (existing.length)
        return res.status(409).json({
          message: 'You have already submitted a complaint for this event',
        });

      // Build media array from uploaded files
      const media = (req.files || []).map(f => ({
        type: fileType(f.mimetype),
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

// ─────────────────────────────────────────────────────────────
// GET /api/complaints/organizer/all
// Organizer views complaints for their own events
// ─────────────────────────────────────────────────────────────
// router.get('/organizer/all', authenticate, requireRole('organizer'), async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT
//          c.complaint_id, c.event_id, c.text_content, c.media,
//          c.status, c.admin_note, c.created_at,
//          e.title           AS event_title,
//          u.unique_username AS reporter_name,
//          u.profile_picture AS reporter_pic
//        FROM \`COMPLAINT\` c
//        JOIN \`EVENT\` e ON c.event_id = e.event_id
//        JOIN \`USER\`  u ON c.buyer_id = u.u_id
//        WHERE e.organizer_id = ?
//        ORDER BY c.created_at DESC`,
//       [req.user.u_id]
//     );
//     res.json(rows.map(r => ({ ...r, media: r.media ? JSON.parse(r.media) : [] })));
//   } catch (err) {
//     console.error('GET /complaints/organizer/all:', err.message);
//     res.status(500).json({ message: 'Failed to load complaints' });
//   }
// });



router.get('/organizer/all', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         c.complaint_id,
         c.event_id,
         c.text_content,
         c.media,
         c.status,
         c.admin_note,
         c.created_at,
         e.title AS event_title,
         u.unique_username AS reporter_name,
         u.profile_picture AS reporter_pic
       FROM \`COMPLAINT\` c
       JOIN \`EVENT\` e ON c.event_id = e.event_id
       JOIN \`USER\`  u ON c.buyer_id = u.u_id
       WHERE e.organizer_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.u_id]
    );

    // ✅ SAFE media parsing (fixes your issue)
    const data = rows.map(r => ({
      ...r,
      media: (() => {
        try {
          return r.media ? JSON.parse(r.media) : [];
        } catch {
          return [];
        }
      })()
    }));

    res.json(data);

  } catch (err) {
    console.error('GET /complaints/organizer/all:', err);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/complaints/admin/all
// Admin views all complaints system-wide with filters
// ─────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const where  = status ? 'WHERE c.status = ?' : '';
    const params = status ? [status] : [];

    const [rows] = await db.query(
      `SELECT
         c.complaint_id, c.event_id, c.text_content, c.media,
         c.status, c.admin_note, c.created_at,
         e.title             AS event_title,
         u.unique_username   AS reporter_name,
         u.profile_picture   AS reporter_pic,
         org.unique_username AS organizer_name
       FROM \`COMPLAINT\` c
       JOIN \`EVENT\` e      ON c.event_id    = e.event_id
       JOIN \`USER\`  u      ON c.buyer_id    = u.u_id
       LEFT JOIN \`USER\` org ON e.organizer_id = org.u_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows.map(r => ({ ...r, media: r.media ? JSON.parse(r.media) : [] })));
  } catch (err) {
    console.error('GET /complaints/admin/all:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/complaints/mine
// Audience views their own submitted complaints
// ─────────────────────────────────────────────────────────────
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
    res.json(rows.map(r => ({ ...r, media: r.media ? JSON.parse(r.media) : [] })));
  } catch (err) {
    console.error('GET /complaints/mine:', err.message);
    res.status(500).json({ message: 'Failed to load complaints' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/complaints/:id/status  (admin only)
// ─────────────────────────────────────────────────────────────
router.put('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const VALID = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!VALID.includes(status))
      return res.status(400).json({ message: `status must be: ${VALID.join(', ')}` });

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

// Multer error handler
// eslint-disable-next-line no-unused-vars
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.startsWith('Unsupported'))
    return res.status(400).json({ message: err.message });
  console.error('Complaints router error:', err);
  res.status(500).json({ message: 'Server error' });
});

module.exports = router;
