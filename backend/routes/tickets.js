const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// POST /api/tickets/buy
router.post('/buy', authenticate, async (req, res) => {
  const { event_id, tier, price, quantity = 1, transaction_id } = req.body;
  const buyer_id = req.user.u_id;

  if (!event_id || !tier) {
    return res.status(400).json({ message: 'event_id and tier are required.' });
  }
  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({ message: 'Quantity must be between 1 and 10.' });
  }

  try {
    // Check how many tickets this user already has for this event
    const [[{ existing }]] = await db.query(
      'SELECT COUNT(*) AS existing FROM TICKET WHERE event_id = ? AND buyer_id = ?',
      [event_id, buyer_id]
    );

    if (existing + quantity > 10) {
      return res.status(400).json({
        message: `You already have ${existing} ticket(s) for this event. You can only hold max 10 per person. You can buy at most ${10 - existing} more.`
      });
    }

    // Check event exists and is bookable
    const [[event]] = await db.query(
      'SELECT event_id, status, tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity FROM EVENT WHERE event_id = ?',
      [event_id]
    );
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (!['approved', 'live'].includes(event.status)) {
      return res.status(400).json({ message: 'This event is not currently accepting ticket purchases.' });
    }

    // Check tier capacity (count already-sold tickets for this tier)
    const tierNum = parseInt(tier);
    const tierCapacity = event[`tier${tierNum}_quantity`] || 0;
    const [[{ soldInTier }]] = await db.query(
      'SELECT COUNT(*) AS soldInTier FROM TICKET WHERE event_id = ? AND tier = ?',
      [event_id, tierNum]
    );

    if (soldInTier + quantity > tierCapacity) {
      return res.status(400).json({
        message: `Not enough seats in this tier. Only ${tierCapacity - soldInTier} seat(s) remaining.`
      });
    }

    // Insert tickets
    // Insert tickets — generate unique QR code for each
const ticketValues = Array.from({ length: quantity }, () => {
  const qr = 'GB-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  return [event_id, buyer_id, tierNum, event[`tier${tierNum}_price`] || price || 0, qr, 0];
});

await db.query(
  'INSERT INTO TICKET (event_id, buyer_id, tier, price, qr_code, used) VALUES ?',
  [ticketValues]
);

    res.json({
      message: `Successfully purchased ${quantity} ticket(s)!`,
      quantity,
      tier: tierNum,
      total_paid: (event[`tier${tierNum}_price`] || price || 0) * quantity,
      transaction_id,
    });

  } catch (err) {
    console.error('Ticket buy error:', err);
    res.status(500).json({ message: 'Failed to purchase tickets.' });
  }
});

// GET /api/tickets/mine  — user's own tickets
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [tickets] = await db.query(`
      SELECT t.ticket_id, t.tier, t.price, t.used, t.purchased_at,
             e.event_id, e.title, e.date AS event_date, e.time AS event_time,
             e.venue, e.city, e.poster AS banner_image
      FROM TICKET t
      JOIN EVENT e ON t.event_id = e.event_id
      WHERE t.buyer_id = ?
      ORDER BY t.purchased_at DESC
    `, [req.user.u_id]);

    // Group by event
    const grouped = {};
    tickets.forEach(t => {
      if (!grouped[t.event_id]) {
        grouped[t.event_id] = {
          event_id: t.event_id, title: t.title,
          event_date: t.event_date, event_time: t.event_time,
          venue: t.venue, city: t.city, banner_image: t.banner_image,
          tickets: [],
        };
      }
      grouped[t.event_id].tickets.push({
        ticket_id: t.ticket_id, tier: t.tier,
        price: t.price, used: t.used, purchased_at: t.purchased_at,
      });
    });

    res.json({ purchases: Object.values(grouped), total_tickets: tickets.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tickets.' });
  }
});

module.exports = router;
