const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

// ─── POST /api/tickets/buy ────────────────────────────────────────────────────
router.post('/buy', authenticate, async (req, res) => {
  const { event_id, tier, quantity = 1, transaction_id } = req.body;
  const buyer_id = req.user.u_id;

  if (!event_id || !tier)
    return res.status(400).json({ message: 'event_id and tier are required' });

  const tierNum = parseInt(tier);
  if (![1, 2, 3].includes(tierNum))
    return res.status(400).json({ message: 'tier must be 1, 2, or 3' });

  const qty = parseInt(quantity);
  if (qty < 1 || qty > 10)
    return res.status(400).json({ message: 'Quantity must be between 1 and 10' });

  try {
    // Count tickets this buyer already holds for this event (all tiers)
    const [[{ existing }]] = await db.query(
      'SELECT COUNT(*) AS existing FROM `TICKET` WHERE event_id = ? AND buyer_id = ?',
      [event_id, buyer_id]
    );

    if (Number(existing) + qty > 10)
      return res.status(400).json({
        message: `You already have ${existing} ticket(s). Max 10 per person. You can buy at most ${10 - existing} more.`,
      });

    // Fetch event
    const [[event]] = await db.query(
      `SELECT event_id, status, launch,
              tier${tierNum}_price    AS tier_price,
              tier${tierNum}_quantity AS tier_capacity
       FROM \`EVENT\` WHERE event_id = ?`,
      [event_id]
    );

    if (!event)
      return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'live' || !event.launch)
      return res.status(400).json({ message: 'This event is not available for ticket purchases' });

    if (!event.tier_capacity || Number(event.tier_capacity) === 0)
      return res.status(400).json({ message: `Tier ${tierNum} is not available for this event` });

    if (Number(event.tier_price) === 0)
      return res.status(400).json({ message: 'Free tickets are not available on this platform' });

    // Count already sold seats in this tier
    const [[{ soldInTier }]] = await db.query(
      'SELECT COUNT(*) AS soldInTier FROM `TICKET` WHERE event_id = ? AND tier = ?',
      [event_id, tierNum]
    );

    if (Number(soldInTier) + qty > Number(event.tier_capacity))
      return res.status(400).json({
        message: `Not enough seats in Tier ${tierNum}. Only ${event.tier_capacity - soldInTier} remaining.`,
      });

    // Build ticket rows — unique QR per ticket
    const ticketValues = Array.from({ length: qty }, () => {
      const qr = `GB-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
      return [event_id, buyer_id, tierNum, Number(event.tier_price), qr, 0];
    });

    await db.query(
      'INSERT INTO `TICKET` (event_id, buyer_id, tier, price, qr_code, used) VALUES ?',
      [ticketValues]
    );

    res.status(201).json({
      message:        `Successfully purchased ${qty} ticket(s)!`,
      quantity:       qty,
      tier:           tierNum,
      total_paid:     Number(event.tier_price) * qty,
      transaction_id: transaction_id || null,
    });
  } catch (err) {
    console.error('POST /tickets/buy:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to purchase tickets' });
  }
});

// ─── GET /api/tickets/mine ────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.ticket_id, t.tier, t.price, t.used,
              t.purchased_at,                          -- ✅ FIX: use actual column name from schema
              t.qr_code,
              e.event_id, e.title AS event_title,
              e.date AS event_date, e.time AS event_time,
              e.venue, e.city,
              e.poster AS banner_image,
              e.status AS event_status,
              s.unique_username AS singer_name
       FROM \`TICKET\` t
       JOIN \`EVENT\` e ON t.event_id = e.event_id
       LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
       WHERE t.buyer_id = ?
       ORDER BY t.purchased_at DESC`,
      [req.user.u_id]
    );

    // Group tickets by event for cleaner frontend rendering
    const grouped = {};
    for (const t of tickets) {
      if (!grouped[t.event_id]) {
        grouped[t.event_id] = {
          event_id:     t.event_id,
          event_title:  t.event_title,
          event_date:   t.event_date,
          event_time:   t.event_time,
          venue:        t.venue,
          city:         t.city,
          banner_image: t.banner_image,
          event_status: t.event_status,
          singer_name:  t.singer_name,
          tickets:      [],
        };
      }
      grouped[t.event_id].tickets.push({
        ticket_id:    t.ticket_id,
        tier:         t.tier,
        price:        t.price,
        used:         t.used,
        qr_code:      t.qr_code,
        purchased_at: t.purchased_at,
      });
    }

    res.json({
      purchases:     Object.values(grouped),
      total_tickets: tickets.length,
    });
  } catch (err) {
    console.error('GET /tickets/mine:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// ─── POST /api/tickets/scan ───────────────────────────────────────────────────
router.post('/scan', authenticate, async (req, res) => {
  try {
    const { qr_code } = req.body;
    if (!qr_code) return res.status(400).json({ message: 'qr_code is required' });

    const [rows] = await db.query(
      `SELECT t.ticket_id, t.tier, t.price, t.used,
              e.event_id, e.title AS event_title, e.organizer_id,
              u.unique_username AS buyer
       FROM \`TICKET\` t
       JOIN \`EVENT\` e ON t.event_id = e.event_id
       JOIN \`USER\`  u ON t.buyer_id  = u.u_id
       WHERE t.qr_code = ?`,
      [qr_code]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'Ticket not found' });

    const ticket = rows[0];

    if (ticket.organizer_id !== req.user.u_id)
      return res.status(403).json({ message: 'This ticket does not belong to your event' });

    if (ticket.used)
      return res.status(400).json({ message: 'Ticket already used', ticket });

    await db.query('UPDATE `TICKET` SET used = 1 WHERE ticket_id = ?', [ticket.ticket_id]);

    res.json({
      message:     'Ticket is valid ✓',
      ticket_id:   ticket.ticket_id,
      tier:        ticket.tier,
      event_title: ticket.event_title,
      buyer:       ticket.buyer,
    });
  } catch (err) {
    console.error('POST /tickets/scan:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to scan ticket' });
  }
});

module.exports = router;
