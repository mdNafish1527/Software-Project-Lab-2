// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();
// const db = require('../db');
// const { authenticate } = require('../middleware/auth');
// const { computeDynamicPrice } = require('../utils/dynamicPricing');

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// function makeTicketCode() {
//   return `GB-${Date.now()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
// }

// // function getTierName(tier) {
// //   const n = Number(tier);
// //   if (n === 1) return 'Standing';
// //   if (n === 2) return 'Chair';
// //   if (n === 3) return 'Sofa';
// //   return `Tier ${tier}`;
// // }


// function getTierName(tier) {
//   if (Number(tier) === 1) return 'Standing - General';
//   if (Number(tier) === 2) return 'Standing - General';
//   if (Number(tier) === 3) return 'VIP';
//   return `Tier ${tier}`;
// }


// function toInt(value, fallback = 0) {
//   const n = parseInt(value, 10);
//   return Number.isNaN(n) ? fallback : n;
// }

// function toMoney(value, fallback = 0) {
//   const n = Number(value);
//   return Number.isFinite(n) ? n : fallback;
// }

// function isDynamicEnabled(value) {
//   return value === 1 || value === true || value === '1';
// }

// function getUserId(req) {
//   return req.user?.u_id || req.user?.user_id || req.user?.id;
// }

// async function getSoldCount(connOrDb, eventId, tierNum) {
//   const [[row]] = await connOrDb.query(
//     'SELECT COUNT(*) AS soldInTier FROM `TICKET` WHERE event_id = ? AND tier = ?',
//     [eventId, tierNum]
//   );
//   return Math.max(0, toInt(row?.soldInTier));
// }

// function normalizeEventTime(value) {
//   if (!value) return value;
//   if (typeof value === 'string') return value;
//   return value;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/tickets/event/:eventId/products
// // Temporary safe response: your database currently has no PRODUCT table.
// // This prevents frontend crashes until marketplace/product SQL is added later.
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/event/:eventId/products', authenticate, async (req, res) => {
//   const eventId = toInt(req.params.eventId);

//   if (!eventId) {
//     return res.status(400).json({ message: 'Valid eventId is required' });
//   }

//   return res.json({
//     products: [],
//     count: 0,
//     message: 'Concert products are not configured yet',
//   });
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/tickets/quote
// // Ticket quote before payment.
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/quote', authenticate, async (req, res) => {
//   try {
//     const eventId = toInt(req.query.event_id);
//     const tierNum = toInt(req.query.tier);
//     const qty = toInt(req.query.quantity || 1, 1);

//     if (!eventId || ![1, 2, 3].includes(tierNum)) {
//       return res.status(400).json({ message: 'event_id and valid tier are required' });
//     }

//     if (qty < 1 || qty > 10) {
//       return res.status(400).json({ message: 'Quantity must be between 1 and 10' });
//     }

//     const [[event]] = await db.query(
//       `
//       SELECT
//         event_id,
//         title,
//         status,
//         launch,
//         date,
//         dynamic_pricing_enable,
//         tier${tierNum}_price AS tier_price,
//         tier${tierNum}_quantity AS tier_capacity
//       FROM \`EVENT\`
//       WHERE event_id = ?
//       `,
//       [eventId]
//     );

//     if (!event) {
//       return res.status(404).json({ message: 'Event not found' });
//     }

//     const capacity = Math.max(0, toInt(event.tier_capacity));
//     const sold = await getSoldCount(db, eventId, tierNum);
//     const remaining = Math.max(0, capacity - sold);
//     const basePrice = toMoney(event.tier_price);

//     const pricing = computeDynamicPrice(basePrice, sold, capacity, event.date);
//     const dynamicEnabled = isDynamicEnabled(event.dynamic_pricing_enable);
//     const finalPrice = dynamicEnabled ? toMoney(pricing.dynamicPrice, basePrice) : basePrice;

//     res.json({
//       event_id: eventId,
//       event_title: event.title,
//       tier: tierNum,
//       tier_name: getTierName(tierNum),
//       quantity: qty,
//       base_price: basePrice,
//       final_price: finalPrice,
//       total_price: finalPrice * qty,
//       capacity,
//       sold,
//       remaining,
//       can_buy: event.status === 'live' && Boolean(event.launch) && qty <= remaining,
//       dynamic_pricing_enabled: dynamicEnabled,
//       pricing,
//     });
//   } catch (err) {
//     console.error('GET /tickets/quote:', err.sqlMessage || err.message);
//     res.status(500).json({ message: 'Failed to calculate ticket quote' });
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // POST /api/tickets/buy
// // Audience buys ticket. This version does not touch PRODUCT / PRODUCT_ORDER.
// // It creates one unique QR/ticket_code per ticket row.
// // ─────────────────────────────────────────────────────────────────────────────
// router.post('/buy', authenticate, async (req, res) => {
//   const conn = await db.getConnection();

//   try {
//     const {
//       event_id,
//       tier,
//       quantity = 1,
//       transaction_id,
//     } = req.body;

//     const buyerId = getUserId(req);
//     const eventId = toInt(event_id);
//     const tierNum = toInt(tier);
//     const qty = toInt(quantity, 1);

//     if (!buyerId) {
//       return res.status(401).json({ message: 'Invalid user token' });
//     }

//     if (!eventId || !tierNum) {
//       return res.status(400).json({ message: 'event_id and tier are required' });
//     }

//     if (![1, 2, 3].includes(tierNum)) {
//       return res.status(400).json({ message: 'tier must be 1, 2, or 3' });
//     }

//     if (qty < 1 || qty > 10) {
//       return res.status(400).json({ message: 'Ticket quantity must be between 1 and 10' });
//     }

//     await conn.beginTransaction();

//     const [[event]] = await conn.query(
//       `
//       SELECT
//         event_id,
//         title,
//         status,
//         launch,
//         date,
//         dynamic_pricing_enable,
//         tier${tierNum}_price AS tier_price,
//         tier${tierNum}_quantity AS tier_capacity
//       FROM \`EVENT\`
//       WHERE event_id = ?
//       FOR UPDATE
//       `,
//       [eventId]
//     );

//     if (!event) {
//       await conn.rollback();
//       return res.status(404).json({ message: 'Event not found' });
//     }

//     if (event.status !== 'live' || !event.launch) {
//       await conn.rollback();
//       return res.status(400).json({
//         message: 'This event is not currently available for ticket purchases',
//       });
//     }

//     const [[existingRow]] = await conn.query(
//       'SELECT COUNT(*) AS existing FROM `TICKET` WHERE event_id = ? AND buyer_id = ?',
//       [eventId, buyerId]
//     );

//     const existingTickets = Math.max(0, toInt(existingRow?.existing));

//     if (existingTickets + qty > 10) {
//       await conn.rollback();
//       return res.status(400).json({
//         message: `You already have ${existingTickets} ticket(s) for this event. Max 10 per person — you can buy at most ${Math.max(0, 10 - existingTickets)} more.`,
//       });
//     }

//     const tierCapacity = Math.max(0, toInt(event.tier_capacity));
//     const basePrice = toMoney(event.tier_price);

//     if (!tierCapacity) {
//       await conn.rollback();
//       return res.status(400).json({
//         message: `${getTierName(tierNum)} is not available for this event`,
//       });
//     }

//     if (!basePrice) {
//       await conn.rollback();
//       return res.status(400).json({
//         message: 'Free tickets are not supported on this platform',
//       });
//     }

//     const sold = await getSoldCount(conn, eventId, tierNum);
//     const remaining = Math.max(0, tierCapacity - sold);

//     if (qty > remaining) {
//       await conn.rollback();
//       return res.status(400).json({
//         message: `Not enough seats in ${getTierName(tierNum)}. Only ${remaining} remaining.`,
//         tier: tierNum,
//         tier_name: getTierName(tierNum),
//         capacity: tierCapacity,
//         sold,
//         remaining,
//       });
//     }

//     const pricing = computeDynamicPrice(basePrice, sold, tierCapacity, event.date);
//     const dynamicEnabled = isDynamicEnabled(event.dynamic_pricing_enable);
//     const finalPrice = dynamicEnabled ? toMoney(pricing.dynamicPrice, basePrice) : basePrice;
//     const ticketTotal = finalPrice * qty;

//     const [ticketOrderResult] = await conn.query(
//       `
//       INSERT INTO \`TICKET_ORDER\`
//         (buyer_id, event_id, total_amount, status, transaction_id)
//       VALUES (?, ?, ?, 'paid', ?)
//       `,
//       [buyerId, eventId, ticketTotal, transaction_id || null]
//     );

//     const ticketOrderId = ticketOrderResult.insertId;
//     const createdTickets = [];

//     const ticketValues = Array.from({ length: qty }, () => {
//       const code = makeTicketCode();

//       createdTickets.push({
//         qr_code: code,
//         ticket_code: code,
//       });

//       return [
//         eventId,
//         buyerId,
//         tierNum,
//         finalPrice,
//         code,
//         code,
//         ticketOrderId,
//         transaction_id || null,
//         0,
//       ];
//     });

//     await conn.query(
//       `
//       INSERT INTO \`TICKET\`
//         (event_id, buyer_id, tier, price, qr_code, ticket_code, order_id, transaction_id, used)
//       VALUES ?
//       `,
//       [ticketValues]
//     );

//     await conn.commit();

//     res.status(201).json({
//       message: `Successfully purchased ${qty} ticket(s)!`,
//       order_id: ticketOrderId,
//       event_id: eventId,
//       event_title: event.title,
//       ticket: {
//         quantity: qty,
//         tier: tierNum,
//         tier_name: getTierName(tierNum),
//         base_price: basePrice,
//         final_price: finalPrice,
//         total_paid: ticketTotal,
//         sold_before_purchase: sold,
//         sold_after_purchase: sold + qty,
//         total_capacity: tierCapacity,
//         remaining_before_purchase: remaining,
//         remaining_after_purchase: Math.max(0, remaining - qty),
//       },
//       tickets: createdTickets,
//       products: [],
//       ticket_total: ticketTotal,
//       product_total: 0,
//       total_paid: ticketTotal,
//       dynamic_pricing_enabled: dynamicEnabled,
//       pricing,
//       transaction_id: transaction_id || null,
//     });
//   } catch (err) {
//     try {
//       await conn.rollback();
//     } catch (_) {}
//     console.error('POST /tickets/buy:', err.sqlMessage || err.message);
//     res.status(500).json({ message: 'Failed to purchase tickets' });
//   } finally {
//     conn.release();
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // GET /api/tickets/mine
// // Audience dashboard tickets. No PRODUCT table query here.
// // Also repairs missing qr_code/ticket_code lazily for old ticket rows.
// // ─────────────────────────────────────────────────────────────────────────────
// router.get('/mine', authenticate, async (req, res) => {
//   try {
//     const buyerId = getUserId(req);

//     if (!buyerId) {
//       return res.status(401).json({ message: 'Invalid user token' });
//     }

//     const [tickets] = await db.query(
//       `
//       SELECT
//         t.ticket_id,
//         t.tier,
//         t.price,
//         t.used,
//         t.purchased_at,
//         t.qr_code,
//         t.ticket_code,
//         t.order_id,
//         t.transaction_id,
//         e.event_id,
//         e.title AS event_title,
//         e.date AS event_date,
//         e.time AS event_time,
//         e.venue,
//         e.city,
//         e.poster AS banner_image,
//         e.status AS event_status,
//         s.unique_username AS singer_name
//       FROM \`TICKET\` t
//       JOIN \`EVENT\` e ON t.event_id = e.event_id
//       LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
//       WHERE t.buyer_id = ?
//       ORDER BY t.purchased_at DESC, t.ticket_id DESC
//       `,
//       [buyerId]
//     );

//     for (const ticket of tickets) {
//       if (!ticket.qr_code && !ticket.ticket_code) {
//         const code = makeTicketCode();
//         ticket.qr_code = code;
//         ticket.ticket_code = code;

//         await db.query(
//           'UPDATE `TICKET` SET qr_code = ?, ticket_code = ? WHERE ticket_id = ?',
//           [code, code, ticket.ticket_id]
//         );
//       } else if (!ticket.qr_code && ticket.ticket_code) {
//         ticket.qr_code = ticket.ticket_code;
//         await db.query('UPDATE `TICKET` SET qr_code = ? WHERE ticket_id = ?', [ticket.ticket_code, ticket.ticket_id]);
//       } else if (ticket.qr_code && !ticket.ticket_code) {
//         ticket.ticket_code = ticket.qr_code;
//         await db.query('UPDATE `TICKET` SET ticket_code = ? WHERE ticket_id = ?', [ticket.qr_code, ticket.ticket_id]);
//       }
//     }

//     const grouped = {};

//     for (const t of tickets) {
//       if (!grouped[t.event_id]) {
//         grouped[t.event_id] = {
//           event_id: t.event_id,
//           event_title: t.event_title,
//           event_date: t.event_date,
//           event_time: normalizeEventTime(t.event_time),
//           venue: t.venue,
//           city: t.city,
//           banner_image: t.banner_image,
//           event_status: t.event_status,
//           singer_name: t.singer_name,
//           tickets: [],
//           concert_products: [],
//         };
//       }

//       grouped[t.event_id].tickets.push({
//         ticket_id: t.ticket_id,
//         tier: t.tier,
//         tier_name: getTierName(t.tier),
//         price: t.price,
//         used: Boolean(t.used),
//         qr_code: t.qr_code,
//         ticket_code: t.ticket_code,
//         order_id: t.order_id,
//         transaction_id: t.transaction_id,
//         purchased_at: t.purchased_at,
//       });
//     }

//     res.json({
//       purchases: Object.values(grouped),
//       total_tickets: tickets.length,
//     });
//   } catch (err) {
//     console.error('GET /tickets/mine:', err.sqlMessage || err.message);
//     res.status(500).json({ message: 'Failed to fetch tickets' });
//   }
// });

// // ─────────────────────────────────────────────────────────────────────────────
// // POST /api/tickets/scan
// // Organizer scans QR and marks ticket as used.
// // ─────────────────────────────────────────────────────────────────────────────
// router.post('/scan', authenticate, async (req, res) => {
//   try {
//     const organizerId = getUserId(req);
//     const { qr_code } = req.body;

//     if (!organizerId) {
//       return res.status(401).json({ message: 'Invalid user token' });
//     }

//     if (!qr_code) {
//       return res.status(400).json({ message: 'qr_code is required' });
//     }

//     const [rows] = await db.query(
//       `
//       SELECT
//         t.ticket_id,
//         t.tier,
//         t.price,
//         t.used,
//         t.qr_code,
//         t.ticket_code,
//         e.event_id,
//         e.title AS event_title,
//         e.organizer_id,
//         u.unique_username AS buyer
//       FROM \`TICKET\` t
//       JOIN \`EVENT\` e ON t.event_id = e.event_id
//       JOIN \`USER\` u ON t.buyer_id = u.u_id
//       WHERE t.qr_code = ? OR t.ticket_code = ?
//       LIMIT 1
//       `,
//       [qr_code, qr_code]
//     );

//     if (!rows.length) {
//       return res.status(404).json({ message: 'Ticket not found' });
//     }

//     const ticket = rows[0];

//     if (Number(ticket.organizer_id) !== Number(organizerId)) {
//       return res.status(403).json({
//         message: 'This ticket does not belong to your event',
//       });
//     }

//     if (ticket.used) {
//       return res.status(400).json({
//         message: 'Ticket has already been used',
//         ticket,
//       });
//     }

//     await db.query('UPDATE `TICKET` SET used = 1 WHERE ticket_id = ?', [ticket.ticket_id]);

//     await db
//       .query(
//         `
//         INSERT INTO \`QR_SCAN_LOG\`
//           (ticket_id, device, result)
//         VALUES (?, ?, 'valid')
//         `,
//         [ticket.ticket_id, req.headers['user-agent'] || 'web']
//       )
//       .catch(() => {});

//     res.json({
//       message: '✓ Ticket is valid',
//       ticket_id: ticket.ticket_id,
//       tier: ticket.tier,
//       tier_name: getTierName(ticket.tier),
//       price: ticket.price,
//       event_id: ticket.event_id,
//       event_title: ticket.event_title,
//       buyer: ticket.buyer,
//       used: true,
//     });
//   } catch (err) {
//     console.error('POST /tickets/scan:', err.sqlMessage || err.message);
//     res.status(500).json({ message: 'Failed to scan ticket' });
//   }
// });

// module.exports = router;





















const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { computeDynamicPrice } = require('../utils/dynamicPricing');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeTicketCode() {
  return `GB-${Date.now()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function getTierName(tier) {
  const n = Number(tier);
  if (n === 1) return 'Chair';
  if (n === 2) return 'Standing';
  if (n === 3) return 'Sofa';
  return `Tier ${tier}`;
}

function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
}

function toMoney(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isDynamicEnabled(value) {
  return value === 1 || value === true || value === '1';
}

function getUserId(req) {
  return req.user?.u_id || req.user?.user_id || req.user?.id;
}

async function getSoldCount(connOrDb, eventId, tierNum) {
  const [[row]] = await connOrDb.query(
    'SELECT COUNT(*) AS soldInTier FROM `TICKET` WHERE event_id = ? AND tier = ?',
    [eventId, tierNum]
  );
  return Math.max(0, toInt(row?.soldInTier));
}

function normalizeEventTime(value) {
  if (!value) return value;
  if (typeof value === 'string') return value;
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/event/:eventId/products
// Temporary safe response: your database currently has no PRODUCT table.
// This prevents frontend crashes until marketplace/product SQL is added later.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/event/:eventId/products', authenticate, async (req, res) => {
  const eventId = toInt(req.params.eventId);

  if (!eventId) {
    return res.status(400).json({ message: 'Valid eventId is required' });
  }

  return res.json({
    products: [],
    count: 0,
    message: 'Concert products are not configured yet',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/quote
// Ticket quote before payment.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/quote', authenticate, async (req, res) => {
  try {
    const eventId = toInt(req.query.event_id);
    const tierNum = toInt(req.query.tier);
    const qty = toInt(req.query.quantity || 1, 1);

    if (!eventId || ![1, 2, 3].includes(tierNum)) {
      return res.status(400).json({ message: 'event_id and valid tier are required' });
    }

    if (qty < 1 || qty > 10) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 10' });
    }

    const [[event]] = await db.query(
      `
      SELECT
        event_id,
        title,
        status,
        launch,
        date,
        dynamic_pricing_enable,
        tier${tierNum}_price AS tier_price,
        tier${tierNum}_quantity AS tier_capacity
      FROM \`EVENT\`
      WHERE event_id = ?
      `,
      [eventId]
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const capacity = Math.max(0, toInt(event.tier_capacity));
    const sold = await getSoldCount(db, eventId, tierNum);
    const remaining = Math.max(0, capacity - sold);
    const basePrice = toMoney(event.tier_price);

    const pricing = computeDynamicPrice(basePrice, sold, capacity, event.date);
    const dynamicEnabled = isDynamicEnabled(event.dynamic_pricing_enable);
    const finalPrice = dynamicEnabled ? toMoney(pricing.dynamicPrice, basePrice) : basePrice;

    res.json({
      event_id: eventId,
      event_title: event.title,
      tier: tierNum,
      tier_name: getTierName(tierNum),
      quantity: qty,
      base_price: basePrice,
      final_price: finalPrice,
      total_price: finalPrice * qty,
      capacity,
      sold,
      remaining,
      can_buy: event.status === 'live' && Boolean(event.launch) && qty <= remaining,
      dynamic_pricing_enabled: dynamicEnabled,
      pricing,
    });
  } catch (err) {
    console.error('GET /tickets/quote:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to calculate ticket quote' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/buy
// Audience buys ticket. This version does not touch PRODUCT / PRODUCT_ORDER.
// It creates one unique QR/ticket_code per ticket row.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/buy', authenticate, async (req, res) => {
  const conn = await db.getConnection();

  try {
    const {
      event_id,
      tier,
      quantity = 1,
      transaction_id,
    } = req.body;

    const buyerId = getUserId(req);
    const eventId = toInt(event_id);
    const tierNum = toInt(tier);
    const qty = toInt(quantity, 1);

    if (!buyerId) {
      return res.status(401).json({ message: 'Invalid user token' });
    }

    if (!eventId || !tierNum) {
      return res.status(400).json({ message: 'event_id and tier are required' });
    }

    if (![1, 2, 3].includes(tierNum)) {
      return res.status(400).json({ message: 'tier must be 1, 2, or 3' });
    }

    if (qty < 1 || qty > 10) {
      return res.status(400).json({ message: 'Ticket quantity must be between 1 and 10' });
    }

    await conn.beginTransaction();

    const [[event]] = await conn.query(
      `
      SELECT
        event_id,
        title,
        status,
        launch,
        date,
        dynamic_pricing_enable,
        tier${tierNum}_price AS tier_price,
        tier${tierNum}_quantity AS tier_capacity
      FROM \`EVENT\`
      WHERE event_id = ?
      FOR UPDATE
      `,
      [eventId]
    );

    if (!event) {
      await conn.rollback();
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'live' || !event.launch) {
      await conn.rollback();
      return res.status(400).json({
        message: 'This event is not currently available for ticket purchases',
      });
    }

    const [[existingRow]] = await conn.query(
      'SELECT COUNT(*) AS existing FROM `TICKET` WHERE event_id = ? AND buyer_id = ?',
      [eventId, buyerId]
    );

    const existingTickets = Math.max(0, toInt(existingRow?.existing));

    if (existingTickets + qty > 10) {
      await conn.rollback();
      return res.status(400).json({
        message: `You already have ${existingTickets} ticket(s) for this event. Max 10 per person — you can buy at most ${Math.max(0, 10 - existingTickets)} more.`,
      });
    }

    const tierCapacity = Math.max(0, toInt(event.tier_capacity));
    const basePrice = toMoney(event.tier_price);

    if (!tierCapacity) {
      await conn.rollback();
      return res.status(400).json({
        message: `${getTierName(tierNum)} is not available for this event`,
      });
    }

    if (!basePrice) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Free tickets are not supported on this platform',
      });
    }

    const sold = await getSoldCount(conn, eventId, tierNum);
    const remaining = Math.max(0, tierCapacity - sold);

    if (qty > remaining) {
      await conn.rollback();
      return res.status(400).json({
        message: `Not enough seats in ${getTierName(tierNum)}. Only ${remaining} remaining.`,
        tier: tierNum,
        tier_name: getTierName(tierNum),
        capacity: tierCapacity,
        sold,
        remaining,
      });
    }

    const pricing = computeDynamicPrice(basePrice, sold, tierCapacity, event.date);
    const dynamicEnabled = isDynamicEnabled(event.dynamic_pricing_enable);
    const finalPrice = dynamicEnabled ? toMoney(pricing.dynamicPrice, basePrice) : basePrice;
    const ticketTotal = finalPrice * qty;

    const [ticketOrderResult] = await conn.query(
      `
      INSERT INTO \`TICKET_ORDER\`
        (buyer_id, event_id, total_amount, status, transaction_id)
      VALUES (?, ?, ?, 'paid', ?)
      `,
      [buyerId, eventId, ticketTotal, transaction_id || null]
    );

    const ticketOrderId = ticketOrderResult.insertId;
    const createdTickets = [];

    const ticketValues = Array.from({ length: qty }, () => {
      const code = makeTicketCode();

      createdTickets.push({
        qr_code: code,
        ticket_code: code,
      });

      return [
        eventId,
        buyerId,
        tierNum,
        finalPrice,
        code,
        code,
        ticketOrderId,
        transaction_id || null,
        0,
      ];
    });

    await conn.query(
      `
      INSERT INTO \`TICKET\`
        (event_id, buyer_id, tier, price, qr_code, ticket_code, order_id, transaction_id, used)
      VALUES ?
      `,
      [ticketValues]
    );

    await conn.commit();

    res.status(201).json({
      message: `Successfully purchased ${qty} ticket(s)!`,
      order_id: ticketOrderId,
      event_id: eventId,
      event_title: event.title,
      ticket: {
        quantity: qty,
        tier: tierNum,
        tier_name: getTierName(tierNum),
        base_price: basePrice,
        final_price: finalPrice,
        total_paid: ticketTotal,
        sold_before_purchase: sold,
        sold_after_purchase: sold + qty,
        total_capacity: tierCapacity,
        remaining_before_purchase: remaining,
        remaining_after_purchase: Math.max(0, remaining - qty),
      },
      tickets: createdTickets,
      products: [],
      ticket_total: ticketTotal,
      product_total: 0,
      total_paid: ticketTotal,
      dynamic_pricing_enabled: dynamicEnabled,
      pricing,
      transaction_id: transaction_id || null,
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {}
    console.error('POST /tickets/buy:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to purchase tickets' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tickets/mine
// Audience dashboard tickets. No PRODUCT table query here.
// Also repairs missing qr_code/ticket_code lazily for old ticket rows.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', authenticate, async (req, res) => {
  try {
    const buyerId = getUserId(req);

    if (!buyerId) {
      return res.status(401).json({ message: 'Invalid user token' });
    }

    const [tickets] = await db.query(
      `
      SELECT
        t.ticket_id,
        t.tier,
        t.price,
        t.used,
        t.purchased_at,
        t.qr_code,
        t.ticket_code,
        t.order_id,
        t.transaction_id,
        e.event_id,
        e.title AS event_title,
        e.date AS event_date,
        e.time AS event_time,
        e.venue,
        e.city,
        e.poster AS banner_image,
        e.status AS event_status,
        s.unique_username AS singer_name
      FROM \`TICKET\` t
      JOIN \`EVENT\` e ON t.event_id = e.event_id
      LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
      WHERE t.buyer_id = ?
      ORDER BY t.purchased_at DESC, t.ticket_id DESC
      `,
      [buyerId]
    );

    for (const ticket of tickets) {
      if (!ticket.qr_code && !ticket.ticket_code) {
        const code = makeTicketCode();
        ticket.qr_code = code;
        ticket.ticket_code = code;

        await db.query(
          'UPDATE `TICKET` SET qr_code = ?, ticket_code = ? WHERE ticket_id = ?',
          [code, code, ticket.ticket_id]
        );
      } else if (!ticket.qr_code && ticket.ticket_code) {
        ticket.qr_code = ticket.ticket_code;
        await db.query('UPDATE `TICKET` SET qr_code = ? WHERE ticket_id = ?', [ticket.ticket_code, ticket.ticket_id]);
      } else if (ticket.qr_code && !ticket.ticket_code) {
        ticket.ticket_code = ticket.qr_code;
        await db.query('UPDATE `TICKET` SET ticket_code = ? WHERE ticket_id = ?', [ticket.qr_code, ticket.ticket_id]);
      }
    }

    const grouped = {};

    for (const t of tickets) {
      if (!grouped[t.event_id]) {
        grouped[t.event_id] = {
          event_id: t.event_id,
          event_title: t.event_title,
          event_date: t.event_date,
          event_time: normalizeEventTime(t.event_time),
          venue: t.venue,
          city: t.city,
          banner_image: t.banner_image,
          event_status: t.event_status,
          singer_name: t.singer_name,
          tickets: [],
          concert_products: [],
        };
      }

      grouped[t.event_id].tickets.push({
        ticket_id: t.ticket_id,
        tier: t.tier,
        tier_name: getTierName(t.tier),
        price: t.price,
        used: Boolean(t.used),
        qr_code: t.qr_code,
        ticket_code: t.ticket_code,
        order_id: t.order_id,
        transaction_id: t.transaction_id,
        purchased_at: t.purchased_at,
      });
    }

    res.json({
      purchases: Object.values(grouped),
      total_tickets: tickets.length,
    });
  } catch (err) {
    console.error('GET /tickets/mine:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tickets/scan
// Organizer scans QR and marks ticket as used.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/scan', authenticate, async (req, res) => {
  try {
    const organizerId = getUserId(req);
    const { qr_code } = req.body;

    if (!organizerId) {
      return res.status(401).json({ message: 'Invalid user token' });
    }

    if (!qr_code) {
      return res.status(400).json({ message: 'qr_code is required' });
    }

    const [rows] = await db.query(
      `
      SELECT
        t.ticket_id,
        t.tier,
        t.price,
        t.used,
        t.qr_code,
        t.ticket_code,
        e.event_id,
        e.title AS event_title,
        e.organizer_id,
        u.unique_username AS buyer
      FROM \`TICKET\` t
      JOIN \`EVENT\` e ON t.event_id = e.event_id
      JOIN \`USER\` u ON t.buyer_id = u.u_id
      WHERE t.qr_code = ? OR t.ticket_code = ?
      LIMIT 1
      `,
      [qr_code, qr_code]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = rows[0];

    if (Number(ticket.organizer_id) !== Number(organizerId)) {
      return res.status(403).json({
        message: 'This ticket does not belong to your event',
      });
    }

    if (ticket.used) {
      return res.status(400).json({
        message: 'Ticket has already been used',
        ticket,
      });
    }

    await db.query('UPDATE `TICKET` SET used = 1 WHERE ticket_id = ?', [ticket.ticket_id]);

    await db
      .query(
        `
        INSERT INTO \`QR_SCAN_LOG\`
          (ticket_id, device, result)
        VALUES (?, ?, 'valid')
        `,
        [ticket.ticket_id, req.headers['user-agent'] || 'web']
      )
      .catch(() => {});

    res.json({
      message: '✓ Ticket is valid',
      ticket_id: ticket.ticket_id,
      tier: ticket.tier,
      tier_name: getTierName(ticket.tier),
      price: ticket.price,
      event_id: ticket.event_id,
      event_title: ticket.event_title,
      buyer: ticket.buyer,
      used: true,
    });
  } catch (err) {
    console.error('POST /tickets/scan:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to scan ticket' });
  }
});

module.exports = router;
