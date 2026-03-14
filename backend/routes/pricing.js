/**
 * backend/routes/pricing.js
 * 
 * Exposes dynamic pricing data for frontend consumption.
 * Mount in server.js as: app.use('/api/pricing', require('./routes/pricing'));
 */

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { computeDynamicPrice, applyDynamicPricingToEvent } = require('../utils/dynamicPricing');

/**
 * GET /api/pricing/event/:eventId
 * Returns dynamic prices for all tiers of one event.
 * Used by the concert modal to show live prices.
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Fetch event + tickets sold count per tier in one query
    const [rows] = await db.query(`
      SELECT
        e.event_id,
        e.title,
        e.date,
        e.tier1_price,    e.tier1_quantity,
        e.tier2_price,    e.tier2_quantity,
        e.tier3_price,    e.tier3_quantity,
        COALESCE(SUM(t.tier = 1), 0) AS tier1_sold,
        COALESCE(SUM(t.tier = 2), 0) AS tier2_sold,
        COALESCE(SUM(t.tier = 3), 0) AS tier3_sold
      FROM EVENT e
      LEFT JOIN TICKET t ON t.event_id = e.event_id
      WHERE e.event_id = ?
      GROUP BY e.event_id
    `, [eventId]);

    if (!rows.length) return res.status(404).json({ message: 'Event not found' });

    const event = rows[0];

    // Build pricing response for each tier
    const tiers = {};
    for (const n of [1, 2, 3]) {
      const base  = Number(event[`tier${n}_price`]    || 0);
      const total = Number(event[`tier${n}_quantity`] || 0);
      const sold  = Number(event[`tier${n}_sold`]     || 0);

      if (total === 0) { tiers[`tier${n}`] = null; continue; }

      tiers[`tier${n}`] = {
        ...computeDynamicPrice(base, sold, total, event.date),
        sold,
        total,
        remaining: total - sold,
      };
    }

    res.json({
      event_id:   event.event_id,
      event_title: event.title,
      event_date: event.date,
      tiers,
      generated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Pricing error:', err);
    res.status(500).json({ message: 'Pricing calculation failed' });
  }
});

/**
 * GET /api/pricing/events
 * Returns dynamic prices for ALL active events (for listing page).
 */
router.get('/events', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.event_id,
        e.title,
        e.date,
        e.tier1_price, e.tier1_quantity,
        e.tier2_price, e.tier2_quantity,
        e.tier3_price, e.tier3_quantity,
        COALESCE(SUM(t.tier = 1), 0) AS tier1_sold,
        COALESCE(SUM(t.tier = 2), 0) AS tier2_sold,
        COALESCE(SUM(t.tier = 3), 0) AS tier3_sold
      FROM EVENT e
      LEFT JOIN TICKET t ON t.event_id = e.event_id
      WHERE e.status IN ('approved', 'live')
      GROUP BY e.event_id
    `);

    const result = {};
    for (const event of rows) {
      const tiers = {};
      for (const n of [1, 2, 3]) {
        const base  = Number(event[`tier${n}_price`]    || 0);
        const total = Number(event[`tier${n}_quantity`] || 0);
        const sold  = Number(event[`tier${n}_sold`]     || 0);
        if (total === 0) { tiers[`tier${n}`] = null; continue; }
        tiers[`tier${n}`] = computeDynamicPrice(base, sold, total, event.date);
      }
      result[event.event_id] = tiers;
    }

    res.json({ pricing: result, generated_at: new Date().toISOString() });

  } catch (err) {
    console.error('Bulk pricing error:', err);
    res.status(500).json({ message: 'Pricing calculation failed' });
  }
});

module.exports = router;
