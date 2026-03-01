const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/events - public: list live events
router.get('/', async (req, res) => {
  try {
    const { city, search } = req.query;
    let query = `
      SELECT e.*, 
        org.unique_username as organizer_name,
        s.unique_username as singer_name,
        s.profile_picture as singer_pic
      FROM EVENT e
      JOIN USER org ON e.organizer_id = org.u_id
      JOIN USER s ON e.singer_id = s.u_id
      WHERE e.status='live'
    `;
    const params = [];
    if (city) { query += ' AND e.city=?'; params.push(city); }
    if (search) { query += ' AND e.title LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY e.date ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.*, 
        org.unique_username as organizer_name,
        s.unique_username as singer_name,
        s.profile_picture as singer_pic
      FROM EVENT e
      JOIN USER org ON e.organizer_id = org.u_id
      JOIN USER s ON e.singer_id = s.u_id
      WHERE e.event_id=?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/booking - organizer requests booking from singer
router.post('/booking', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { singer_id, date, venue, city } = req.body;

    // Check singer is available
    const [sp] = await pool.query('SELECT availability FROM SINGER_PROFILE WHERE singer_id=?', [singer_id]);
    if (sp.length === 0 || sp[0].availability !== 'available')
      return res.status(400).json({ message: 'Singer is not available' });

    const [result] = await pool.query(
      'INSERT INTO BOOKING_REQUEST (organizer_id, singer_id, date, venue, city) VALUES (?,?,?,?,?)',
      [req.user.u_id, singer_id, date, venue, city]
    );
    res.status(201).json({ message: 'Booking request sent', booking_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/bookings/mine - singer sees their booking requests
router.get('/bookings/mine', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT br.*, org.unique_username as organizer_name
      FROM BOOKING_REQUEST br
      JOIN USER org ON br.organizer_id = org.u_id
      WHERE br.singer_id=?
      ORDER BY br.created_at DESC
    `, [req.user.u_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/events/booking/:id/respond - singer accepts/rejects
router.put('/booking/:id/respond', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' or 'rejected'
    const [bookings] = await pool.query(
      'SELECT * FROM BOOKING_REQUEST WHERE booking_id=? AND singer_id=?',
      [req.params.id, req.user.u_id]
    );
    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found' });
    await pool.query('UPDATE BOOKING_REQUEST SET status=? WHERE booking_id=?', [action, req.params.id]);
    res.json({ message: `Booking ${action}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/booking/:id/pay - organizer pays singer fee
router.post('/booking/:id/pay', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [bookings] = await pool.query(
      'SELECT * FROM BOOKING_REQUEST WHERE booking_id=? AND organizer_id=? AND status=?',
      [req.params.id, req.user.u_id, 'accepted']
    );
    if (bookings.length === 0) return res.status(404).json({ message: 'No accepted booking found' });
    await pool.query('UPDATE BOOKING_REQUEST SET payment_status=? WHERE booking_id=?', ['paid', req.params.id]);
    res.json({ message: 'Payment successful. You can now create the concert.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events - organizer creates event after paying
router.post('/', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { booking_id, title, description, poster, tier1_price, tier1_quantity,
      tier2_price, tier2_quantity, tier3_price, tier3_quantity, dynamic_pricing_enable } = req.body;

    const [bookings] = await pool.query(
      'SELECT * FROM BOOKING_REQUEST WHERE booking_id=? AND organizer_id=? AND payment_status=?',
      [booking_id, req.user.u_id, 'paid']
    );
    if (bookings.length === 0)
      return res.status(400).json({ message: 'Booking must be paid before creating event' });

    const booking = bookings[0];
    const [result] = await pool.query(
      `INSERT INTO EVENT 
        (organizer_id, singer_id, title, description, poster, date, time, venue, city, fee, status,
         dynamic_pricing_enable, tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.u_id, booking.singer_id, title, description, poster,
        booking.date, '20:00:00', booking.venue, booking.city, 0,
        'approved', dynamic_pricing_enable || false,
        tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity]
    );
    res.status(201).json({ message: 'Concert created', event_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/launch - go live
router.post('/:id/launch', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE EVENT SET status=?, launch=TRUE WHERE event_id=? AND organizer_id=?',
      ['live', req.params.id, req.user.u_id]
    );
    res.json({ message: 'Concert is now live!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/custom-url - request custom URL
router.post('/:id/custom-url', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { custom_url } = req.body;
    await pool.query(
      'UPDATE EVENT SET custom_url=?, custom_url_status=? WHERE event_id=? AND organizer_id=?',
      [custom_url, 'pending', req.params.id, req.user.u_id]
    );
    res.json({ message: 'Custom URL request submitted for admin approval' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/approve-url - admin approves custom URL
router.post('/:id/approve-url', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query(
      "UPDATE EVENT SET custom_url_status='approved' WHERE event_id=?",
      [req.params.id]
    );
    res.json({ message: 'Custom URL approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/organizer/mine
router.get('/organizer/mine', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM EVENT WHERE organizer_id=? ORDER BY created_at DESC',
      [req.user.u_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/admin/all - admin sees all events
router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM EVENT ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;