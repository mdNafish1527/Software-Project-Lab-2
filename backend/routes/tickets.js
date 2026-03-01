const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendTicketEmail } = require('../utils/email');

// POST /api/tickets/buy - audience buys tickets
router.post('/buy', authenticate, requireRole('audience'), async (req, res) => {
  try {
    const { event_id, tier, quantity } = req.body;

    if (quantity > 10)
      return res.status(400).json({ message: 'Maximum 10 tickets per event' });

    const [events] = await pool.query('SELECT * FROM EVENT WHERE event_id=? AND status=?', [event_id, 'live']);
    if (events.length === 0)
      return res.status(404).json({ message: 'Event not found or not live' });

    const event = events[0];
    const priceKey = `tier${tier}_price`;
    const qtyKey = `tier${tier}_quantity`;
    const tierPrice = event[priceKey];
    let availableQty = event[qtyKey];

    if (!tierPrice || availableQty < quantity)
      return res.status(400).json({ message: 'Not enough tickets available' });

    const total = tierPrice * quantity;

    // Simulate payment
    const [orderResult] = await pool.query(
      'INSERT INTO TICKET_ORDER (buyer_id, event_id, total_amount, status) VALUES (?,?,?,?)',
      [req.user.u_id, event_id, total, 'paid']
    );

    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const qrData = uuidv4();
      const [tRes] = await pool.query(
        'INSERT INTO TICKET (event_id, buyer_id, tier, price, qr_code) VALUES (?,?,?,?,?)',
        [event_id, req.user.u_id, tier, tierPrice, qrData]
      );
      tickets.push({ ticket_id: tRes.insertId, tier, qr_code: qrData, price: tierPrice });
    }

    // Deduct quantity
    await pool.query(`UPDATE EVENT SET ${qtyKey}=? WHERE event_id=?`, [availableQty - quantity, event_id]);

    // Get user email
    const [users] = await pool.query('SELECT email FROM USER WHERE u_id=?', [req.user.u_id]);
    await sendTicketEmail(users[0].email, tickets, event.title);

    res.status(201).json({ message: 'Tickets purchased!', tickets, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tickets/mine - audience sees their tickets
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, e.title as event_title, e.date, e.venue, e.city, e.poster
      FROM TICKET t
      JOIN EVENT e ON t.event_id = e.event_id
      WHERE t.buyer_id=?
      ORDER BY t.purchased_at DESC
    `, [req.user.u_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tickets/scan - organizer scans QR code
router.post('/scan', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { qr_code, device } = req.body;
    const [tickets] = await pool.query(
      `SELECT t.*, e.organizer_id FROM TICKET t
       JOIN EVENT e ON t.event_id = e.event_id
       WHERE t.qr_code=?`,
      [qr_code]
    );

    if (tickets.length === 0) {
      await pool.query(
        "INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (0, ?, 'invalid')",
        [device]
      );
      return res.status(400).json({ message: 'Invalid QR code', result: 'invalid' });
    }

    const ticket = tickets[0];

    // Check organizer owns this event
    if (ticket.organizer_id !== req.user.u_id)
      return res.status(403).json({ message: 'This ticket is not for your event' });

    if (ticket.used) {
      await pool.query(
        'INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (?,?,?)',
        [ticket.ticket_id, device, 'duplicate']
      );
      return res.status(400).json({ message: 'Ticket already used', result: 'duplicate' });
    }

    await pool.query('UPDATE TICKET SET used=TRUE WHERE ticket_id=?', [ticket.ticket_id]);
    await pool.query(
      'INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (?,?,?)',
      [ticket.ticket_id, device, 'valid']
    );

    res.json({ message: 'Valid ticket! Entry granted.', result: 'valid' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tickets/event/:id - organizer sees ticket stats for event
router.get('/event/:id', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tier, COUNT(*) as total, SUM(used) as used_count, SUM(price) as revenue
      FROM TICKET WHERE event_id=? GROUP BY tier
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;