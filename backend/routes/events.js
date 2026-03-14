const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events  — Browse all concerts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    if (status) {
      where.push('e.status = ?');
      params.push(status);
    } else {
      where.push("e.status IN ('approved', 'live', 'ended') AND e.date >= CURDATE()");
    }

    if (search) {
      where.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.city LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM EVENT e ${whereClause}`, params
    );
    const total = countRows[0].total;

    const [events] = await db.query(
      `SELECT
        e.event_id AS id, e.title, e.description, e.poster AS banner_image,
        e.date AS event_date, e.time AS event_time, e.venue, e.city,
        e.fee, e.status, e.custom_url, e.launch,
        e.tier1_price, e.tier1_quantity,
        e.tier2_price, e.tier2_quantity,
        e.tier3_price, e.tier3_quantity,
        e.created_at,
        o.unique_username AS organizer_name, o.profile_picture AS organizer_pic,
        s.unique_username AS singer_name,    s.profile_picture AS singer_pic
      FROM EVENT e
      LEFT JOIN USER o ON e.organizer_id = o.u_id
      LEFT JOIN USER s ON e.singer_id    = s.u_id
      ${whereClause}
      ORDER BY e.date ASC
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
        e.event_id AS id, e.title, e.poster AS banner_image,
        e.date AS event_date, e.time AS event_time,
        e.venue, e.city, e.status, e.custom_url,
        e.tier1_price, e.tier2_price, e.tier3_price,
        s.unique_username AS singer_name
      FROM EVENT e
      LEFT JOIN USER s ON e.singer_id = s.u_id
      WHERE e.status IN ('approved', 'live') AND e.date >= CURDATE()
      ORDER BY e.date ASC
      LIMIT 6`
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load featured events' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events/:id  — Concert detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const idOrSlug = req.params.id;

    const [rows] = await db.query(
      `SELECT
        e.event_id AS id, e.title, e.description, e.poster AS banner_image,
        e.date AS event_date, e.time AS event_time, e.venue, e.city,
        e.fee, e.status, e.custom_url, e.launch,
        e.tier1_price, e.tier1_quantity,
        e.tier2_price, e.tier2_quantity,
        e.tier3_price, e.tier3_quantity,
        e.created_at,
        o.unique_username AS organizer_name, o.profile_picture AS organizer_pic,
        s.unique_username AS singer_name,    s.profile_picture AS singer_pic
      FROM EVENT e
      LEFT JOIN USER o ON e.organizer_id = o.u_id
      LEFT JOIN USER s ON e.singer_id    = s.u_id
      WHERE e.event_id = ? OR e.custom_url = ?`,
      [idOrSlug, idOrSlug]
    );

    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    // Get remaining tickets per tier
    const event = rows[0];
    const [sold] = await db.query(
      `SELECT tier, COUNT(*) as sold FROM TICKET WHERE event_id = ? GROUP BY tier`,
      [event.id]
    );
    const soldMap = {};
    sold.forEach(r => soldMap[r.tier] = r.sold);

    event.available_tier1 = Math.max(0, (event.tier1_quantity || 0) - (soldMap[1] || 0));
    event.available_tier2 = Math.max(0, (event.tier2_quantity || 0) - (soldMap[2] || 0));
    event.available_tier3 = Math.max(0, (event.tier3_quantity || 0) - (soldMap[3] || 0));

    res.json(event);
  } catch (err) {
    console.error('GET /events/:id error:', err);
    res.status(500).json({ message: 'Failed to load event' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events/booking  — Organizer books a singer
// ─────────────────────────────────────────────────────────────────────────────
router.post('/booking', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { singer_id, event_date, venue, message, proposed_fee } = req.body;
    if (!singer_id || !event_date || !venue)
      return res.status(400).json({ message: 'singer_id, event_date and venue are required' });

    const [result] = await db.query(
      `INSERT INTO BOOKING_REQUEST (organizer_id, singer_id, event_date, venue, message, proposed_fee, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [req.user.u_id, singer_id, event_date, venue, message || '', proposed_fee || 0]
    );
    res.status(201).json({ message: 'Booking request sent', booking_id: result.insertId });
  } catch (err) {
    console.error('POST /booking error:', err);
    res.status(500).json({ message: 'Failed to send booking request' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/events/bookings/mine  — Singer sees booking requests
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bookings/mine', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, o.unique_username AS organizer_name, o.email AS organizer_email
       FROM BOOKING_REQUEST b
       JOIN USER o ON b.organizer_id = o.u_id
       WHERE b.singer_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.u_id]
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
    if (!['accepted', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Status must be accepted or rejected' });

    const [rows] = await db.query(
      'SELECT * FROM BOOKING_REQUEST WHERE id = ? AND singer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Booking not found' });

    await db.query(
      'UPDATE BOOKING_REQUEST SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: `Booking ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to respond to booking' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: POST /api/events  — Organizer creates a concert
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const {
      title, description, poster, date, time, venue, city, fee,
      tier1_price, tier1_quantity,
      tier2_price, tier2_quantity,
      tier3_price, tier3_quantity,
      singer_id,
    } = req.body;

    if (!title || !venue || !date)
      return res.status(400).json({ message: 'title, venue and date are required' });

    const [result] = await db.query(
      `INSERT INTO EVENT (
        organizer_id, singer_id, title, description, poster,
        date, time, venue, city, fee, status,
        tier1_price, tier1_quantity,
        tier2_price, tier2_quantity,
        tier3_price, tier3_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        req.user.u_id, singer_id || null,
        title, description || '', poster || '',
        date, time || '18:00:00', venue, city || 'Dhaka',
        fee || 0,
        tier1_price || 0, tier1_quantity || 0,
        tier2_price || 0, tier2_quantity || 0,
        tier3_price || 0, tier3_quantity || 0,
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
      'SELECT * FROM EVENT WHERE event_id = ? AND organizer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    await db.query(
      "UPDATE EVENT SET launch = 1, status = 'approved' WHERE event_id = ?",
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
      'SELECT event_id FROM EVENT WHERE custom_url = ? AND event_id != ?',
      [custom_url, req.params.id]
    );
    if (existing.length) return res.status(400).json({ message: 'This URL is already taken' });

    const [rows] = await db.query(
      'SELECT * FROM EVENT WHERE event_id = ? AND organizer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    await db.query(
      "UPDATE EVENT SET custom_url = ?, custom_url_status = 'pending' WHERE event_id = ?",
      [custom_url, req.params.id]
    );
    res.json({ message: 'Custom URL request submitted for admin approval' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to request custom URL' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED: GET /api/events/organizer/mine
// ─────────────────────────────────────────────────────────────────────────────
router.get('/organizer/mine', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, s.unique_username AS singer_name
       FROM EVENT e
       LEFT JOIN USER s ON e.singer_id = s.u_id
       WHERE e.organizer_id = ?
       ORDER BY e.created_at DESC`,
      [req.user.u_id]
    );
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load your events' });
  }
});

module.exports = router;
