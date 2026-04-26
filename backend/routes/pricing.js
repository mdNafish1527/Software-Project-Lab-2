/**
 * backend/routes/pricing.js
 *
 * Exposes dynamic pricing data for frontend consumption.
 * Mount in server.js as:
 * app.use('/api/pricing', require('./routes/pricing'));
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { computeDynamicPrice } = require('../utils/dynamicPricing');

function safeRemaining(total, sold) {
  return Math.max(0, Number(total || 0) - Number(sold || 0));
}

function isDynamicEnabled(value) {
  return value === 1 || value === true || value === '1';
}

function buildTierPricing(event, n) {
  const base = Number(event[`tier${n}_price`] || 0);
  const total = Number(event[`tier${n}_quantity`] || 0);
  const sold = Number(event[`tier${n}_sold`] || 0);
  const remaining = safeRemaining(total, sold);

  if (!total) return null;

  const pricing = computeDynamicPrice(base, sold, total, event.date || event.event_date);
  const enabled = isDynamicEnabled(event.dynamic_pricing_enable);
  const finalPrice = enabled ? pricing.dynamicPrice : base;

  return {
    tier: n,
    tier_name: n === 1 ? 'Standing' : n === 2 ? 'Chair' : 'Sofa',
    base_price: base,
    dynamic_price: pricing.dynamicPrice,
    final_price: finalPrice,
    dynamic_pricing_enabled: enabled,
    sold,
    total,
    remaining,
    sold_percent: pricing.soldPercent,
    days_left: pricing.daysLeft,
    multiplier: pricing.multiplier,
    demand_level: pricing.demandLevel,
    price_change: pricing.priceChange,
    percent_change: pricing.percentChange,
    reason: pricing.reason,
  };
}

/**
 * GET /api/pricing/event/:eventId
 * Returns dynamic prices for all tiers of one event.
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        e.event_id,
        e.title,
        e.date,
        e.status,
        e.launch,
        e.dynamic_pricing_enable,
        e.tier1_price,
        e.tier1_quantity,
        e.tier2_price,
        e.tier2_quantity,
        e.tier3_price,
        e.tier3_quantity,
        COALESCE(SUM(CASE WHEN t.tier = 1 THEN 1 ELSE 0 END), 0) AS tier1_sold,
        COALESCE(SUM(CASE WHEN t.tier = 2 THEN 1 ELSE 0 END), 0) AS tier2_sold,
        COALESCE(SUM(CASE WHEN t.tier = 3 THEN 1 ELSE 0 END), 0) AS tier3_sold
      FROM \`EVENT\` e
      LEFT JOIN \`TICKET\` t ON t.event_id = e.event_id
      WHERE e.event_id = ?
      GROUP BY
        e.event_id,
        e.title,
        e.date,
        e.status,
        e.launch,
        e.dynamic_pricing_enable,
        e.tier1_price,
        e.tier1_quantity,
        e.tier2_price,
        e.tier2_quantity,
        e.tier3_price,
        e.tier3_quantity
      `,
      [eventId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = rows[0];

    res.json({
      event_id: event.event_id,
      event_title: event.title,
      event_date: event.date,
      status: event.status,
      launch: Boolean(event.launch),
      dynamic_pricing_enabled: isDynamicEnabled(event.dynamic_pricing_enable),
      tiers: {
        tier1: buildTierPricing(event, 1),
        tier2: buildTierPricing(event, 2),
        tier3: buildTierPricing(event, 3),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/pricing/event/:eventId:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Pricing calculation failed' });
  }
});

/**
 * GET /api/pricing/events
 * Returns dynamic prices for all approved/live events.
 */
router.get('/events', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        e.event_id,
        e.title,
        e.date,
        e.status,
        e.launch,
        e.dynamic_pricing_enable,
        e.tier1_price,
        e.tier1_quantity,
        e.tier2_price,
        e.tier2_quantity,
        e.tier3_price,
        e.tier3_quantity,
        COALESCE(SUM(CASE WHEN t.tier = 1 THEN 1 ELSE 0 END), 0) AS tier1_sold,
        COALESCE(SUM(CASE WHEN t.tier = 2 THEN 1 ELSE 0 END), 0) AS tier2_sold,
        COALESCE(SUM(CASE WHEN t.tier = 3 THEN 1 ELSE 0 END), 0) AS tier3_sold
      FROM \`EVENT\` e
      LEFT JOIN \`TICKET\` t ON t.event_id = e.event_id
      WHERE e.status IN ('approved', 'live')
      GROUP BY
        e.event_id,
        e.title,
        e.date,
        e.status,
        e.launch,
        e.dynamic_pricing_enable,
        e.tier1_price,
        e.tier1_quantity,
        e.tier2_price,
        e.tier2_quantity,
        e.tier3_price,
        e.tier3_quantity
      ORDER BY e.date ASC
      `
    );

    const pricing = {};

    for (const event of rows) {
      pricing[event.event_id] = {
        event_id: event.event_id,
        event_title: event.title,
        event_date: event.date,
        status: event.status,
        launch: Boolean(event.launch),
        dynamic_pricing_enabled: isDynamicEnabled(event.dynamic_pricing_enable),
        tiers: {
          tier1: buildTierPricing(event, 1),
          tier2: buildTierPricing(event, 2),
          tier3: buildTierPricing(event, 3),
        },
      };
    }

    res.json({
      pricing,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('GET /api/pricing/events:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Pricing calculation failed' });
  }
});

module.exports = router;
