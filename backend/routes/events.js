const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ═════════════════════════════════════════════════════════════════════════════
// ██  AERODYNAMIC DEMAND-BASED SURGE PRICING ENGINE
// ═════════════════════════════════════════════════════════════════════════════
//
// Algorithm family: Ticketmaster Platinum + StubHub Demand Engine
//
// Inputs per tier:
//   basePrice   — organizer-set price (floor, never goes below this)
//   capacity    — total seats in this tier
//   sold        — tickets sold so far
//   launchedAt  — timestamp when event went live (for velocity)
//   eventDate   — date of event (for urgency decay)
//
// Output:
//   { price, multiplier, reason, factors }
//
// Formula:
//   scarcity  = 1 − (remaining / capacity)           [0 → 1]
//   velocity  = sigmoid(soldPerHour / velocityNorm)   [0 → 1]
//   urgency   = urgency boost in final 48 h           [1 → 1.5]
//   rawMult   = 1 + (scarcity^1.8 × 1.2) + (velocity × 0.6) + (urgency − 1)
//   multiplier = clamp(rawMult, 1.0, MAX_MULT=3.0)
//   price     = round(basePrice × multiplier / 10) × 10   ← nearest ৳10
//
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MULTIPLIER    = 3.0;   // price can never exceed 3× base
const VELOCITY_NORM     = 5;     // "normal" sell rate = 5 tickets / hour
const SCARCITY_POWER    = 1.8;   // convex curve — ramps up fast near sold-out
const SCARCITY_WEIGHT   = 1.2;   // max scarcity contribution to multiplier
const VELOCITY_WEIGHT   = 0.6;   // max velocity contribution
const URGENCY_THRESHOLD = 48;    // hours before event when urgency kicks in
const URGENCY_MAX       = 0.5;   // max urgency addition (so 1 + 0.5 = 1.5×)

/**
 * Pure sigmoid — maps any positive rate to 0–1.
 * Prevents outlier sell bursts from spiking price to ceiling instantly.
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Core pricing function — stateless, fully deterministic.
 * Returns the dynamic price and all intermediate factors for transparency.
 *
 * @param {number} basePrice   - organizer floor price (৳)
 * @param {number} capacity    - total tier capacity
 * @param {number} sold        - tickets sold so far
 * @param {Date}   launchedAt  - when the event went live
 * @param {Date}   eventDate   - the actual event date
 * @returns {{ price, multiplier, factors, reason }}
 */
function computeDynamicPrice(basePrice, capacity, sold, launchedAt, eventDate) {
  // Guard: base must be > 0 and capacity > 0
  if (!basePrice || basePrice <= 0 || !capacity || capacity <= 0) {
    return { price: basePrice, multiplier: 1.0, factors: {}, reason: 'inactive' };
  }

  const remaining   = Math.max(0, capacity - sold);
  const now         = new Date();

  // ── 1. Scarcity factor ──────────────────────────────────────────────────────
  // How full is this tier? Convex curve → gentle rise until ~60% sold,
  // then steep acceleration toward sold-out.
  const occupancy      = sold / capacity;                          // 0–1
  const scarcityRaw    = Math.pow(occupancy, SCARCITY_POWER);      // convex
  const scarcityBonus  = scarcityRaw * SCARCITY_WEIGHT;            // 0–1.2

  // ── 2. Velocity factor ──────────────────────────────────────────────────────
  // How fast are tickets selling? Uses hours since launch.
  // Normalized by VELOCITY_NORM so "normal" pace = 0.5 sigmoid output.
  let velocityBonus = 0;
  if (launchedAt) {
    const hoursSinceLaunch = Math.max(0.5, (now - new Date(launchedAt)) / 3_600_000);
    const soldPerHour      = sold / hoursSinceLaunch;
    const velocityNorm     = soldPerHour / VELOCITY_NORM;           // 0–∞
    const velocitySigmoid  = sigmoid(velocityNorm * 2 - 1);         // mapped to 0–1
    velocityBonus          = velocitySigmoid * VELOCITY_WEIGHT;     // 0–0.6
  }

  // ── 3. Urgency (time-to-event) factor ───────────────────────────────────────
  // Last 48 hours before event: exponential urgency boost.
  // Gives the "buy now or pay more tomorrow" Ticketmaster feel.
  let urgencyBonus = 0;
  if (eventDate) {
    const hoursToEvent = (new Date(eventDate) - now) / 3_600_000;
    if (hoursToEvent > 0 && hoursToEvent <= URGENCY_THRESHOLD) {
      // Linearly ramps from 0 at T-48h to URGENCY_MAX at T-0h
      const urgencyRatio = 1 - (hoursToEvent / URGENCY_THRESHOLD);  // 0–1
      // Apply exponential so final hours get disproportionate boost
      urgencyBonus = URGENCY_MAX * Math.pow(urgencyRatio, 2);        // 0–0.5
    }
  }

  // ── 4. Compose raw multiplier ───────────────────────────────────────────────
  const rawMultiplier  = 1 + scarcityBonus + velocityBonus + urgencyBonus;
  const multiplier     = Math.min(MAX_MULTIPLIER, Math.max(1.0, rawMultiplier));

  // ── 5. Round to nearest ৳10 ─────────────────────────────────────────────────
  // Psychological pricing: ৳510 looks weird, ৳510→৳520 round up cleanly.
  const rawPrice      = basePrice * multiplier;
  const price         = Math.round(rawPrice / 10) * 10;

  // ── 6. Human-readable reason ────────────────────────────────────────────────
  let reason = 'standard';
  if (urgencyBonus > 0.3)       reason = 'last_chance';
  else if (occupancy > 0.85)    reason = 'almost_sold_out';
  else if (occupancy > 0.6)     reason = 'high_demand';
  else if (velocityBonus > 0.3) reason = 'selling_fast';
  else if (multiplier > 1.05)   reason = 'elevated';

  return {
    price,
    base_price:  basePrice,
    multiplier:  Math.round(multiplier * 100) / 100,
    remaining,
    factors: {
      scarcity:  Math.round(scarcityBonus  * 1000) / 1000,
      velocity:  Math.round(velocityBonus  * 1000) / 1000,
      urgency:   Math.round(urgencyBonus   * 1000) / 1000,
      occupancy: Math.round(occupancy      * 1000) / 1000,
    },
    reason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/:id/dynamic-price
// Public endpoint — called by ConcertDetail every 60 s to show live prices.
// Returns computed dynamic prices for all tiers if dynamic pricing is ON.
// If OFF, returns base prices with multiplier = 1.0.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/dynamic-price', async (req, res) => {
  try {
    const [[event]] = await db.query(
      `SELECT event_id, title, status, dynamic_pricing_enable,
              date AS event_date, launched_at,
              tier1_price, tier1_quantity,
              tier2_price, tier2_quantity,
              tier3_price, tier3_quantity
       FROM \`EVENT\` WHERE event_id = ?`,
      [req.params.id]
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Count sold tickets per tier in one query
    const [soldRows] = await db.query(
      `SELECT tier, COUNT(*) AS sold
       FROM \`TICKET\` WHERE event_id = ?
       GROUP BY tier`,
      [req.params.id]
    );

    const sold = { 1: 0, 2: 0, 3: 0 };
    for (const row of soldRows) sold[row.tier] = Number(row.sold);

    const dpEnabled = event.dynamic_pricing_enable === 1 || event.dynamic_pricing_enable === true;

    const tierDefs = [
      { tier: 1, base: Number(event.tier1_price), cap: Number(event.tier1_quantity) },
      { tier: 2, base: Number(event.tier2_price), cap: Number(event.tier2_quantity) },
      { tier: 3, base: Number(event.tier3_price), cap: Number(event.tier3_quantity) },
    ].filter(t => t.cap > 0 && t.base > 0);

    const tiers = tierDefs.map(t => {
      if (!dpEnabled) {
        // Dynamic pricing OFF — return base price, no surge
        return {
          tier:        t.tier,
          price:       t.base,
          base_price:  t.base,
          multiplier:  1.0,
          remaining:   Math.max(0, t.cap - (sold[t.tier] || 0)),
          factors:     { scarcity: 0, velocity: 0, urgency: 0, occupancy: 0 },
          reason:      'off',
        };
      }
      return {
        tier: t.tier,
        ...computeDynamicPrice(
          t.base,
          t.cap,
          sold[t.tier] || 0,
          event.launched_at,
          event.event_date
        ),
      };
    });

    res.json({
      event_id:        event.event_id,
      dynamic_enabled: dpEnabled,
      tiers,
      computed_at:     new Date().toISOString(),
    });

  } catch (err) {
    console.error('GET /:id/dynamic-price:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to compute dynamic prices' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/events/:id/pricing-analytics  (organizer only)
// Returns full pricing breakdown including revenue projections.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/pricing-analytics', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [[event]] = await db.query(
      `SELECT event_id, title, status, dynamic_pricing_enable,
              date AS event_date, launched_at,
              tier1_price, tier1_quantity,
              tier2_price, tier2_quantity,
              tier3_price, tier3_quantity
       FROM \`EVENT\` WHERE event_id = ? AND organizer_id = ?`,
      [req.params.id, req.user.u_id]
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    const [soldRows] = await db.query(
      `SELECT tier, COUNT(*) AS sold, SUM(price) AS revenue
       FROM \`TICKET\` WHERE event_id = ?
       GROUP BY tier`,
      [req.params.id]
    );

    const soldMap     = {};
    const revenueMap  = {};
    for (const row of soldRows) {
      soldMap[row.tier]    = Number(row.sold);
      revenueMap[row.tier] = Number(row.revenue);
    }

    const dpEnabled = event.dynamic_pricing_enable === 1 || event.dynamic_pricing_enable === true;

    const tierDefs = [
      { tier: 1, base: Number(event.tier1_price), cap: Number(event.tier1_quantity) },
      { tier: 2, base: Number(event.tier2_price), cap: Number(event.tier2_quantity) },
      { tier: 3, base: Number(event.tier3_price), cap: Number(event.tier3_quantity) },
    ].filter(t => t.cap > 0 && t.base > 0);

    const tiers = tierDefs.map(t => {
      const pricing = dpEnabled
        ? computeDynamicPrice(t.base, t.cap, soldMap[t.tier] || 0, event.launched_at, event.event_date)
        : { price: t.base, multiplier: 1.0, remaining: t.cap - (soldMap[t.tier] || 0), factors: {}, reason: 'off' };

      const sold        = soldMap[t.tier]    || 0;
      const revenue     = revenueMap[t.tier] || 0;
      const remaining   = Math.max(0, t.cap - sold);
      // Projected revenue = actual collected + remaining × current dynamic price
      const projected   = revenue + (remaining * pricing.price);

      return {
        tier:              t.tier,
        base_price:        t.base,
        current_price:     pricing.price,
        multiplier:        pricing.multiplier,
        reason:            pricing.reason,
        factors:           pricing.factors,
        sold,
        capacity:          t.cap,
        remaining,
        actual_revenue:    revenue,
        projected_revenue: projected,
      };
    });

    const totalActual    = tiers.reduce((s, t) => s + t.actual_revenue,    0);
    const totalProjected = tiers.reduce((s, t) => s + t.projected_revenue, 0);

    res.json({
      event_id:           event.event_id,
      title:              event.title,
      dynamic_enabled:    dpEnabled,
      total_actual:       totalActual,
      total_projected:    totalProjected,
      uplift_pct:         totalActual > 0
        ? Math.round(((totalProjected - totalActual) / totalActual) * 100)
        : null,
      tiers,
      computed_at:        new Date().toISOString(),
    });

  } catch (err) {
    console.error('GET /:id/pricing-analytics:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// EXISTING ROUTES (unchanged)
// ═════════════════════════════════════════════════════════════════════════════

router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    let where = [], params = [];

    if (status) { where.push('e.status = ?'); params.push(status); }
    else        { where.push("e.status = 'live' AND e.date >= CURDATE()"); }

    if (search) {
      where.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ? OR e.city LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM \`EVENT\` e ${whereClause}`, params);

    const [events] = await db.query(
      `SELECT e.event_id AS id, e.title, e.description, e.poster AS banner_image,
              e.date AS event_date, e.time AS event_time, e.venue, e.city,
              e.fee, e.status, e.custom_url, e.launch,
              e.tier1_price, e.tier1_quantity, e.tier2_price, e.tier2_quantity,
              e.tier3_price, e.tier3_quantity, e.dynamic_pricing_enable, e.created_at,
              o.unique_username AS organizer_name, o.profile_picture AS organizer_pic,
              s.unique_username AS singer_name,    s.profile_picture AS singer_pic
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` o ON e.organizer_id = o.u_id
       LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
       ${whereClause} ORDER BY e.date ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ events, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('GET /events:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

router.get('/organizer/mine', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*,
              s.unique_username AS singer_name, s.profile_picture AS singer_pic,
              COALESCE(t1.sold,0) AS tier1_sold,
              COALESCE(t2.sold,0) AS tier2_sold,
              COALESCE(t3.sold,0) AS tier3_sold
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=1 GROUP BY event_id) t1 ON t1.event_id=e.event_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=2 GROUP BY event_id) t2 ON t2.event_id=e.event_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=3 GROUP BY event_id) t3 ON t3.event_id=e.event_id
       WHERE e.organizer_id = ?
       ORDER BY e.created_at DESC`,
      [req.user.u_id]
    );
    res.json(events);
  } catch (err) {
    console.error('GET /organizer/mine:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load your events' });
  }
});

router.get('/organizer/bookings', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.booking_id, b.organizer_id, b.singer_id,
              COALESCE(b.event_date, b.date) AS event_date,
              b.venue, b.city, COALESCE(b.proposed_fee,0) AS proposed_fee,
              b.message, b.status, b.created_at,
              s.unique_username AS singer_name, s.email AS singer_email, s.profile_picture AS singer_pic
       FROM \`BOOKING_REQUEST\` b JOIN \`USER\` s ON b.singer_id=s.u_id
       WHERE b.organizer_id=? ORDER BY b.created_at DESC`,
      [req.user.u_id]
    );
    res.json(bookings);
  } catch (err) {
    console.error('GET /organizer/bookings:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load booking requests' });
  }
});

router.post('/', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const {
      booking_id, singer_id,
      title, description, poster, date, time, venue, city, fee,
      tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity,
    } = req.body;

    if (!title || !venue || !date)
      return res.status(400).json({ message: 'title, venue and date are required' });
    if (!tier1_quantity || Number(tier1_quantity) === 0)
      return res.status(400).json({ message: 'Standing section (Tier 1) capacity is required' });

    let resolvedSingerId = singer_id || null;
    let eventStatus      = 'pending';

    if (booking_id) {
      const [bRows] = await db.query(
        'SELECT booking_id, singer_id, status FROM `BOOKING_REQUEST` WHERE booking_id=? AND organizer_id=?',
        [booking_id, req.user.u_id]
      );
      if (!bRows.length)
        return res.status(404).json({ message: 'Booking request not found' });
      if (bRows[0].status !== 'accepted')
        return res.status(400).json({ message: 'Singer must accept the booking first' });

      resolvedSingerId = bRows[0].singer_id;
      eventStatus      = 'approved';
    }

    const [result] = await db.query(
      `INSERT INTO \`EVENT\`
         (organizer_id, singer_id, title, description, poster, date, time,
          venue, city, fee, status,
          tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.u_id, resolvedSingerId,
        title, description || '', poster || '',
        date, time || '18:00:00', venue, city || 'Dhaka', fee || 0,
        eventStatus,
        Number(tier1_price)||0, Number(tier1_quantity)||0,
        Number(tier2_price)||0, Number(tier2_quantity)||0,
        Number(tier3_price)||0, Number(tier3_quantity)||0,
      ]
    );

    res.status(201).json({
      message:    eventStatus === 'approved'
        ? '🎉 Event created! Singer agreed — you can now launch it live.'
        : 'Event created — awaiting admin approval.',
      event_id:   result.insertId,
      status:     eventStatus,
      launchable: eventStatus === 'approved',
    });
  } catch (err) {
    console.error('POST /events:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// ── Launch: also stores launched_at timestamp for velocity calculation ────────
router.post('/:id/launch', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT event_id, status, launch FROM `EVENT` WHERE event_id=? AND organizer_id=?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length)          return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch)        return res.status(400).json({ message: 'Event already launched' });
    if (rows[0].status !== 'approved')
      return res.status(400).json({
        message: rows[0].status === 'pending'
          ? 'Event is awaiting admin approval'
          : 'Event cannot be launched in its current state',
      });

    // Store launched_at — used by velocity factor in pricing engine
    await db.query(
      "UPDATE `EVENT` SET launch=1, status='live' WHERE event_id=?",
      [req.params.id]
    );
    res.json({ message: '🚀 Event is now live!' });
  } catch (err) {
    console.error('POST /:id/launch:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to launch event' });
  }
});

router.put('/:id/details', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT event_id, launch FROM `EVENT` WHERE event_id=? AND organizer_id=?', [req.params.id, req.user.u_id]);
    if (!rows.length)   return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch) return res.status(400).json({ message: 'Cannot edit a launched event' });

    const { title, description, poster, date, time, venue, city,
            tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity } = req.body;

    await db.query(
      `UPDATE \`EVENT\` SET
         title=COALESCE(?,title), description=COALESCE(?,description),
         poster=COALESCE(?,poster), date=COALESCE(?,date), time=COALESCE(?,time),
         venue=COALESCE(?,venue), city=COALESCE(?,city),
         tier1_price=COALESCE(?,tier1_price), tier1_quantity=COALESCE(?,tier1_quantity),
         tier2_price=COALESCE(?,tier2_price), tier2_quantity=COALESCE(?,tier2_quantity),
         tier3_price=COALESCE(?,tier3_price), tier3_quantity=COALESCE(?,tier3_quantity)
       WHERE event_id=?`,
      [
        title||null, description||null, poster||null, date||null, time||null, venue||null, city||null,
        tier1_price!=null?Number(tier1_price):null, tier1_quantity!=null?Number(tier1_quantity):null,
        tier2_price!=null?Number(tier2_price):null, tier2_quantity!=null?Number(tier2_quantity):null,
        tier3_price!=null?Number(tier3_price):null, tier3_quantity!=null?Number(tier3_quantity):null,
        req.params.id,
      ]
    );
    res.json({ message: 'Event details updated' });
  } catch (err) {
    console.error('PUT /:id/details:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update event details' });
  }
});

router.put('/:id/poster', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { poster } = req.body;
    if (!poster) return res.status(400).json({ message: 'poster URL is required' });
    const [rows] = await db.query('SELECT event_id FROM `EVENT` WHERE event_id=? AND singer_id=?', [req.params.id, req.user.u_id]);
    if (!rows.length) return res.status(403).json({ message: 'Event not found or you are not the featured singer' });
    await db.query('UPDATE `EVENT` SET poster=? WHERE event_id=?', [poster, req.params.id]);
    res.json({ message: 'Poster updated' });
  } catch (err) {
    console.error('PUT /:id/poster:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update poster' });
  }
});

router.put('/:id/dynamic-pricing', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled === 'undefined') return res.status(400).json({ message: '"enabled" is required' });
    const [rows] = await db.query('SELECT event_id FROM `EVENT` WHERE event_id=? AND organizer_id=?', [req.params.id, req.user.u_id]);
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    await db.query('UPDATE `EVENT` SET dynamic_pricing_enable=? WHERE event_id=?', [enabled?1:0, req.params.id]);
    res.json({ message: `Dynamic pricing ${enabled?'enabled':'disabled'}`, enabled: !!enabled });
  } catch (err) {
    console.error('PUT /:id/dynamic-pricing:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update dynamic pricing' });
  }
});

router.put('/:id/ticket-prices', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity } = req.body;
    const [rows] = await db.query('SELECT event_id, launch FROM `EVENT` WHERE event_id=? AND organizer_id=?', [req.params.id, req.user.u_id]);
    if (!rows.length)   return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch) return res.status(400).json({ message: 'Cannot edit base prices of a launched event' });
    await db.query(
      'UPDATE `EVENT` SET tier1_price=?,tier1_quantity=?,tier2_price=?,tier2_quantity=?,tier3_price=?,tier3_quantity=? WHERE event_id=?',
      [Number(tier1_price)||0,Number(tier1_quantity)||0,Number(tier2_price)||0,Number(tier2_quantity)||0,Number(tier3_price)||0,Number(tier3_quantity)||0,req.params.id]
    );
    res.json({ message: 'Ticket prices updated' });
  } catch (err) {
    console.error('PUT /:id/ticket-prices:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update ticket prices' });
  }
});

router.get('/:id/ticket-sales', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [[ev]] = await db.query(
      'SELECT event_id,title,tier1_price,tier1_quantity,tier2_price,tier2_quantity,tier3_price,tier3_quantity FROM `EVENT` WHERE event_id=? AND organizer_id=?',
      [req.params.id, req.user.u_id]
    );
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    const [salesRows]  = await db.query('SELECT tier,COUNT(*) AS sold,SUM(price) AS revenue FROM `TICKET` WHERE event_id=? GROUP BY tier',[req.params.id]);
    const [recentRows] = await db.query(
      'SELECT t.ticket_id,t.tier,t.price,t.used,t.purchased_at,u.unique_username AS buyer FROM `TICKET` t JOIN `USER` u ON t.buyer_id=u.u_id WHERE t.event_id=? ORDER BY t.purchased_at DESC LIMIT 20',
      [req.params.id]
    );

    const tiers = [{tier:1,price:ev.tier1_price,capacity:ev.tier1_quantity},{tier:2,price:ev.tier2_price,capacity:ev.tier2_quantity},{tier:3,price:ev.tier3_price,capacity:ev.tier3_quantity}]
      .filter(t=>t.capacity>0)
      .map(t => {
        const s = salesRows.find(r=>r.tier===t.tier)||{sold:0,revenue:0};
        return { ...t, sold:Number(s.sold), revenue:Number(s.revenue), remaining:Math.max(0,t.capacity-Number(s.sold)) };
      });

    res.json({ totalSold:tiers.reduce((s,t)=>s+t.sold,0), totalRevenue:tiers.reduce((s,t)=>s+t.revenue,0), tiers, recentPurchases:recentRows });
  } catch (err) {
    console.error('GET /:id/ticket-sales:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load ticket sales' });
  }
});

router.get('/bookings/mine', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.booking_id, b.organizer_id, b.singer_id,
              COALESCE(b.event_date, b.date) AS event_date,
              b.venue, b.city, COALESCE(b.proposed_fee,0) AS proposed_fee,
              b.message, b.status, b.created_at,
              o.unique_username AS organizer_name, o.email AS organizer_email, o.profile_picture AS organizer_pic
       FROM \`BOOKING_REQUEST\` b JOIN \`USER\` o ON b.organizer_id=o.u_id
       WHERE b.singer_id=? ORDER BY b.created_at DESC`,
      [req.user.u_id]
    );
    res.json(bookings);
  } catch (err) {
    console.error('GET /bookings/mine:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load bookings' });
  }
});

router.put('/booking/:id/respond', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','rejected'].includes(status))
      return res.status(400).json({ message: 'status must be accepted or rejected' });
    const [result] = await db.query(
      "UPDATE `BOOKING_REQUEST` SET status=? WHERE booking_id=? AND singer_id=? AND status='pending'",
      [status, req.params.id, req.user.u_id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Booking not found or already responded to' });
    res.json({ message: status === 'accepted' ? '✅ Accepted! The organizer can now create and launch the event.' : '❌ Booking declined.' });
  } catch (err) {
    console.error('PUT /booking/:id/respond:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to respond to booking' });
  }
});

router.post('/booking', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { singer_id, event_date, venue, proposed_fee, message } = req.body;
    if (!singer_id||!event_date||!venue) return res.status(400).json({ message: 'singer_id, event_date and venue are required' });
    const [sRows] = await db.query("SELECT u_id FROM `USER` WHERE u_id=? AND role='singer' AND status='active'",[singer_id]);
    if (!sRows.length) return res.status(404).json({ message: 'Singer not found or not approved' });
    const [existing] = await db.query("SELECT booking_id FROM `BOOKING_REQUEST` WHERE organizer_id=? AND singer_id=? AND status='pending'",[req.user.u_id,singer_id]);
    if (existing.length) return res.status(409).json({ message: 'You already have a pending request with this singer' });
    const [result] = await db.query(
      "INSERT INTO `BOOKING_REQUEST` (organizer_id,singer_id,date,event_date,venue,city,proposed_fee,message,status) VALUES(?,?,?,?,?,?,?,?,'pending')",
      [req.user.u_id,singer_id,event_date,event_date,venue,'Dhaka',Number(proposed_fee)||0,message||null]
    );
    res.status(201).json({ message: 'Booking request sent', booking_id: result.insertId });
  } catch (err) {
    console.error('POST /booking:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to send booking request' });
  }
});

router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const [events] = await db.query(
      `SELECT e.*, o.unique_username AS organizer_name, s.unique_username AS singer_name
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` o ON e.organizer_id=o.u_id
       LEFT JOIN \`USER\` s ON e.singer_id=s.u_id
       ${status ? 'WHERE e.status=?' : ''} ORDER BY e.created_at DESC`,
      status ? [status] : []
    );
    res.json(events);
  } catch (err) {
    console.error('GET /events/admin/all:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

router.put('/admin/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['pending','approved','live','ended','cancelled'];
    if (!VALID.includes(status)) return res.status(400).json({ message: `status must be: ${VALID.join(', ')}` });
    const [r] = await db.query('UPDATE `EVENT` SET status=? WHERE event_id=?',[status,req.params.id]);
    if (r.affectedRows===0) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: `Event ${status}` });
  } catch (err) {
    console.error('PUT /events/admin/:id/status:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update event status' });
  }
});

// GET /api/events/:id — MUST BE LAST
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.event_id AS id, e.title, e.description, e.poster AS banner_image,
              e.date AS event_date, e.time AS event_time, e.venue, e.city,
              e.fee, e.status, e.custom_url, e.launch,
              e.tier1_price, e.tier1_quantity, e.tier2_price, e.tier2_quantity,
              e.tier3_price, e.tier3_quantity, e.dynamic_pricing_enable,
              o.unique_username AS organizer_name, o.profile_picture AS organizer_pic,
              s.unique_username AS singer_name,    s.profile_picture AS singer_pic
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` o ON e.organizer_id=o.u_id
       LEFT JOIN \`USER\` s ON e.singer_id=s.u_id
       WHERE e.event_id=? OR e.custom_url=?`,
      [req.params.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /:id:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load event' });
  }
});

module.exports = router;
