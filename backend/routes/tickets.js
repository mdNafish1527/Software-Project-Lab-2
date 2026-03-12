const express = require('express');
const router = express.Router();
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendTicketEmail } = require('../utils/email');

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/tickets/buy
//  Audience buys 1–10 tickets for one event tier
// ─────────────────────────────────────────────────────────────────────────────
router.post('/buy', authenticate, requireRole('audience'), async (req, res) => {
  try {
    let { event_id, tier, quantity, transaction_id } = req.body;

    // FIX #1: validate + default quantity so the loop always runs correctly
    quantity = parseInt(quantity, 10);
    if (!quantity || isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 10)
      return res.status(400).json({ message: 'Maximum 10 tickets per purchase' });

    if (!event_id || !tier)
      return res.status(400).json({ message: 'event_id and tier are required' });

    tier = parseInt(tier, 10);
    if (![1, 2, 3].includes(tier))
      return res.status(400).json({ message: 'tier must be 1, 2 or 3' });

    // Fetch event
    const [events] = await pool.query(
      'SELECT * FROM EVENT WHERE event_id=? AND status=?',
      [event_id, 'live']
    );
    if (events.length === 0)
      return res.status(404).json({ message: 'Event not found or not live' });

    const event = events[0];
    const priceKey = `tier${tier}_price`;
    const qtyKey   = `tier${tier}_quantity`;
    const tierPrice    = parseFloat(event[priceKey]);
    const availableQty = parseInt(event[qtyKey], 10);

    if (!tierPrice || isNaN(tierPrice))
      return res.status(400).json({ message: `Tier ${tier} is not available for this event` });
    if (isNaN(availableQty) || availableQty < quantity)
      return res.status(400).json({ message: `Only ${availableQty || 0} ticket(s) remaining in this tier` });

    const total = tierPrice * quantity;

    // FIX #2: store transaction_id in TICKET_ORDER
    const [orderResult] = await pool.query(
      'INSERT INTO TICKET_ORDER (buyer_id, event_id, total_amount, status, transaction_id) VALUES (?,?,?,?,?)',
      [req.user.u_id, event_id, total, 'paid', transaction_id || null]
    );
    const order_id = orderResult.insertId;

    // FIX #1: loop now guaranteed to run `quantity` times (1–10)
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const qrData = uuidv4();
      const ticketCode = `TKT-${event_id}-${tier}-${Date.now()}-${i}`;

      const [tRes] = await pool.query(
        // FIX #2: also store transaction_id and order_id on each ticket row
        `INSERT INTO TICKET
           (event_id, buyer_id, tier, price, qr_code, ticket_code, order_id, transaction_id)
         VALUES (?,?,?,?,?,?,?,?)`,
        [event_id, req.user.u_id, tier, tierPrice, qrData, ticketCode, order_id, transaction_id || null]
      );

      tickets.push({
        ticket_id:      tRes.insertId,
        ticket_code:    ticketCode,
        tier,
        price:          tierPrice,
        qr_code:        qrData,
        transaction_id: transaction_id || null,
      });
    }

    // Deduct quantity from event
    await pool.query(
      `UPDATE EVENT SET ${qtyKey} = ${qtyKey} - ? WHERE event_id = ?`,
      [quantity, event_id]
    );

    // Send email (non-blocking — don't fail purchase if email fails)
    try {
      const [users] = await pool.query('SELECT email FROM USER WHERE u_id=?', [req.user.u_id]);
      if (users[0]?.email) {
        await sendTicketEmail(users[0].email, tickets, event.title);
      }
    } catch (emailErr) {
      console.warn('[tickets] Email send failed (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      message: `${quantity} ticket${quantity > 1 ? 's' : ''} purchased successfully!`,
      tickets,
      total,
      order_id,
    });

  } catch (err) {
    console.error('[tickets/buy]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/tickets/mine
//  Returns all tickets for the logged-in audience user
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.ticket_id,
        t.ticket_id   AS id,          -- FIX #3: alias so dashboard key={ticket.id} works
        t.tier,
        t.price,
        t.qr_code,
        t.ticket_code,
        t.used,
        t.used        AS scanned,     -- FIX #4: alias so dashboard ticket.scanned works too
        t.purchased_at,
        t.transaction_id,
        t.order_id,
        e.title       AS event_title,
        e.date,
        e.date        AS event_date,  -- alias for any old code still using event_date
        e.time,
        e.venue,
        e.city,
        e.poster
      FROM TICKET t
      JOIN EVENT e ON t.event_id = e.event_id
      WHERE t.buyer_id = ?
      ORDER BY t.purchased_at DESC
    `, [req.user.u_id]);

    res.json(rows);

  } catch (err) {
    console.error('[tickets/mine]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/tickets/scan
//  Organizer scans QR at venue entrance
// ─────────────────────────────────────────────────────────────────────────────
router.post('/scan', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { qr_code, device } = req.body;

    if (!qr_code)
      return res.status(400).json({ message: 'qr_code is required' });

    const [tickets] = await pool.query(
      `SELECT t.*, e.organizer_id, e.title AS event_title
       FROM TICKET t
       JOIN EVENT e ON t.event_id = e.event_id
       WHERE t.qr_code = ?`,
      [qr_code]
    );

    if (tickets.length === 0) {
      await pool.query(
        "INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (0, ?, 'invalid')",
        [device || 'unknown']
      ).catch(() => {});
      return res.status(400).json({ message: 'Invalid QR code', result: 'invalid' });
    }

    const ticket = tickets[0];

    if (ticket.organizer_id !== req.user.u_id)
      return res.status(403).json({ message: 'This ticket is not for your event', result: 'unauthorized' });

    if (ticket.used) {
      await pool.query(
        'INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (?,?,?)',
        [ticket.ticket_id, device || 'unknown', 'duplicate']
      ).catch(() => {});
      return res.status(400).json({
        message: 'Ticket already used',
        result: 'duplicate',
        event: ticket.event_title,
      });
    }

    // Mark as used
    await pool.query('UPDATE TICKET SET used=TRUE WHERE ticket_id=?', [ticket.ticket_id]);
    await pool.query(
      'INSERT INTO QR_SCAN_LOG (ticket_id, device, result) VALUES (?,?,?)',
      [ticket.ticket_id, device || 'unknown', 'valid']
    ).catch(() => {});

    res.json({
      message: '✅ Valid ticket! Entry granted.',
      result: 'valid',
      event: ticket.event_title,
      tier: ticket.tier,
    });

  } catch (err) {
    console.error('[tickets/scan]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/tickets/event/:id
//  Organizer sees ticket stats for their event
// ─────────────────────────────────────────────────────────────────────────────
router.get('/event/:id', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        tier,
        COUNT(*)       AS total_sold,
        SUM(used)      AS used_count,
        SUM(price)     AS revenue
      FROM TICKET
      WHERE event_id = ?
      GROUP BY tier
      ORDER BY tier
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('[tickets/event]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
