// ═══════════════════════════════════════════════════════════════════════════
//  FILE LOCATION: backend/routes/events.js
//
//  ADD THESE ROUTES AT THE TOP of your existing events.js file,
//  BEFORE the routes that require auth middleware.
//  These routes are PUBLIC — no login needed.
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const db = require('../db');
// Keep your existing auth import below:
// const { verifyToken, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: GET /api/events  — Browse all concerts (NO LOGIN REQUIRED)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { genre, status, search, page = 1, limit = 12, featured } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    // Only show upcoming + completed (not cancelled) by default
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

    // Count total for pagination
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM events e ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Fetch events with organizer info
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
// PUBLIC: GET /api/events/featured  — Featured concerts for homepage
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
// PUBLIC: GET /api/events/genres  — List of all genres (for filter dropdown)
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
// PUBLIC: GET /api/events/:id  — Concert detail (NO LOGIN REQUIRED)
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

    // Ticket availability info
    event.available_general = Math.max(0, event.total_tickets_general - event.sold_tickets_general);
    event.available_vip = Math.max(0, event.total_tickets_vip - event.sold_tickets_vip);
    event.available_student = Math.max(0, event.total_tickets_student - event.sold_tickets_student);

    res.json(event);
  } catch (err) {
    console.error('GET /events/:id error:', err);
    res.status(500).json({ message: 'Failed to load event' });
  }
});

// ─── YOUR EXISTING AUTH-PROTECTED ROUTES CONTINUE BELOW ───────────────────
// (booking, creating events, launching, etc. — keep those as they are)

module.exports = router;
