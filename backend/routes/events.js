const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { genre, status, search, page = 1, limit = 12, featured } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (status) {
      where.push('e.status = ?');
      params.push(status);
    } else {
      where.push("e.status IN ('upcoming', 'completed', 'ongoing')");
    }

    if (genre) {
      where.push('e.genre LIKE ?');
      params.push(`%${genre}%`);
    }

    if (search) {
      where.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.genre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (featured === 'true') {
      where.push('e.is_featured = 1');
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM events e ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [events] = await db.query(
      `SELECT
        e.id, e.title, e.description, e.venue, e.event_date, e.event_time,
        e.duration_minutes, e.banner_image, e.genre, e.status,
        e.ticket_price_general, e.ticket_price_vip, e.ticket_price_student,
        e.total_tickets_general, e.total_tickets_vip, e.total_tickets_student,
        e.sold_tickets_general, e.sold_tickets_vip, e.sold_tickets_student,
        e.is_featured, e.custom_url, e.created_at,
        u.name AS organizer_name, u.profile_pic AS organizer_pic,
        s.name AS singer_name, s.profile_pic AS singer_pic
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN users s ON e.singer_id = s.id
      ${whereClause}
      ORDER BY e.is_featured DESC, e.event_date ASC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GET /events error:', err);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events/featured
// ─────────────────────────────────────────────────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT
        e.id, e.title, e.venue, e.event_date, e.event_time, e.banner_image,
        e.genre, e.status, e.ticket_price_general, e.ticket_price_student,
        e.is_featured, e.custom_url,
        u.name AS organizer_name,
        s.name AS singer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN users s ON e.singer_id = s.id
      WHERE e.is_featured = 1 AND e.status = 'upcoming'
      ORDER BY e.event_date ASC
      LIMIT 6`
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load featured events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events/genres
// ─────────────────────────────────────────────────────────────────────────────
router.get('/genres', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT genre FROM events WHERE genre IS NOT NULL ORDER BY genre'
    );
    res.json(rows.map(r => r.genre));
  } catch (err) {
    res.status(500).json({ message: 'Failed to load genres' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const idOrSlug = req.params.id;

    const [rows] = await db.query(
      `SELECT
        e.*,
        u.name AS organizer_name, u.email AS organizer_email,
        u.profile_pic AS organizer_pic, u.bio AS organizer_bio,
        s.name AS singer_name, s.profile_pic AS singer_pic, s.bio AS singer_bio
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN users s ON e.singer_id = s.id
      WHERE e.id = ? OR e.custom_url = ?`,
      [idOrSlug, idOrSlug]
    );

    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    const event = rows[0];
    event.available_general = Math.max(0, event.total_tickets_general - event.sold_tickets_general);
    event.available_vip     = Math.max(0, event.total_tickets_vip     - event.sold_tickets_vip);
    event.available_student = Math.max(0, event.total_tickets_student - event.sold_tickets_student);

    res.json(event);
  } catch (err) {
    console.error('GET /events/:id error:', err);
    res.status(500).json({ message: 'Failed to load event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/booking
// ─────────────────────────────────────────────────────────────────────────────
router.post('/booking', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { singer_id, event_date, venue, message, proposed_fee } = req.body;
    if (!singer_id || !event_date || !venue) {
      return res.status(400).json({ message: 'singer_id, event_date and venue are required' });
    }

    const [result] = await db.query(
      `INSERT INTO bookings (organizer_id, singer_id, event_date, venue, message, proposed_fee, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [req.user.id, singer_id, event_date, venue, message || '', proposed_fee || 0]
    );

    res.status(201).json({ message: 'Booking request sent', booking_id: result.insertId });
  } catch (err) {
    console.error('POST /booking error:', err);
    res.status(500).json({ message: 'Failed to send booking request' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/events/bookings/mine
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bookings/mine', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.name AS organizer_name, u.email AS organizer_email
       FROM bookings b
       JOIN users u ON b.organizer_id = u.id
       WHERE b.singer_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: PUT /api/events/booking/:id/respond
// ─────────────────────────────────────────────────────────────────────────────
router.put('/booking/:id/respond', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    const [rows] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND singer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    await db.query(
      'UPDATE bookings SET status = ?, responded_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );

    res.json({ message: `Booking ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to booking' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/booking/:id/pay
// ─────────────────────────────────────────────────────────────────────────────
router.post('/booking/:id/pay', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND organizer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });
    if (rows[0].status !== 'accepted') {
      return res.status(400).json({ message: 'Booking must be accepted before payment' });
    }

    await db.query(
      'UPDATE bookings SET payment_status = ?, paid_at = NOW() WHERE id = ?',
      ['paid', req.params.id]
    );

    res.json({ message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events  — Create concert
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const {
      title, description, venue, event_date, event_time, duration_minutes,
      banner_image, genre, singer_id,
      ticket_price_general, ticket_price_vip, ticket_price_student,
      total_tickets_general, total_tickets_vip, total_tickets_student,
    } = req.body;

    if (!title || !venue || !event_date) {
      return res.status(400).json({ message: 'title, venue and event_date are required' });
    }

    const [result] = await db.query(
      `INSERT INTO events (
        title, description, venue, event_date, event_time, duration_minutes,
        banner_image, genre, organizer_id, singer_id, status,
        ticket_price_general, ticket_price_vip, ticket_price_student,
        total_tickets_general, total_tickets_vip, total_tickets_student,
        sold_tickets_general, sold_tickets_vip, sold_tickets_student,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW())`,
      [
        title, description || '', venue, event_date, event_time || '18:00:00',
        duration_minutes || 120, banner_image || '', genre || '',
        req.user.id, singer_id || null,
        ticket_price_general || 0, ticket_price_vip || 0, ticket_price_student || 0,
        total_tickets_general || 0, total_tickets_vip || 0, total_tickets_student || 0,
      ]
    );

    res.status(201).json({ message: 'Concert created', event_id: result.insertId });
  } catch (err) {
    console.error('POST /events error:', err);
    res.status(500).json({ message: 'Failed to create concert' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/:id/launch
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/launch', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    await db.query(
      "UPDATE events SET status = 'upcoming', launched_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: 'Concert is now live!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to launch concert' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/:id/custom-url
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/custom-url', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { custom_url } = req.body;
    if (!custom_url) return res.status(400).json({ message: 'custom_url is required' });

    const [existing] = await db.query(
      'SELECT id FROM events WHERE custom_url = ? AND id != ?',
      [custom_url, req.params.id]
    );
    if (existing.length) return res.status(400).json({ message: 'This URL is already taken' });

    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    await db.query(
      'UPDATE events SET custom_url = ?, url_status = ? WHERE id = ?',
      [custom_url, 'pending', req.params.id]
    );

    res.json({ message: 'Custom URL request submitted for admin approval' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to request custom URL' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/:id/approve-url
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/approve-url', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    await db.query(
      "UPDATE events SET url_status = 'approved' WHERE id = ?",
      [req.params.id]
    );

    res.json({ message: 'Custom URL approved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve URL' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/events/organizer/mine
// ─────────────────────────────────────────────────────────────────────────────
router.get('/organizer/mine', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, s.name AS singer_name
       FROM events e
       LEFT JOIN users s ON e.singer_id = s.id
       WHERE e.organizer_id = ?
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your events' });
  }
});

module.exports = router;
