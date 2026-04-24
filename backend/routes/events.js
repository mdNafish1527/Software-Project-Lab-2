const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── PUBLIC ───────────────────────────────────────────────────

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
              s.unique_username AS singer_name,
              s.profile_picture AS singer_pic,
              COALESCE(t1.sold, 0) AS tier1_sold,
              COALESCE(t2.sold, 0) AS tier2_sold,
              COALESCE(t3.sold, 0) AS tier3_sold
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=1 GROUP BY event_id) t1 ON t1.event_id = e.event_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=2 GROUP BY event_id) t2 ON t2.event_id = e.event_id
       LEFT JOIN (SELECT event_id, COUNT(*) AS sold FROM \`TICKET\` WHERE tier=3 GROUP BY event_id) t3 ON t3.event_id = e.event_id
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

// ─── ORGANIZER ────────────────────────────────────────────────

router.get('/organizer/mine', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, s.unique_username AS singer_name, s.profile_picture AS singer_pic
       FROM \`EVENT\` e LEFT JOIN \`USER\` s ON e.singer_id = s.u_id
       WHERE e.organizer_id = ? ORDER BY e.created_at DESC`,
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
              b.venue, b.city, COALESCE(b.proposed_fee, 0) AS proposed_fee,
              b.message, b.status, b.created_at,
              s.unique_username AS singer_name, s.email AS singer_email,
              s.profile_picture AS singer_pic
       FROM \`BOOKING_REQUEST\` b JOIN \`USER\` s ON b.singer_id = s.u_id
       WHERE b.organizer_id = ? ORDER BY b.created_at DESC`,
      [req.user.u_id]
    );
    res.json(bookings);
  } catch (err) {
    console.error('GET /organizer/bookings:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load booking requests' });
  }
});

// POST /api/events
// KEY CHANGE: if booking_id is provided and singer accepted,
// event is created as 'approved' — organizer can launch immediately
router.post('/', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const {
      booking_id, singer_id,
      title, description, poster, date, time, venue, city, fee,
      tier1_price, tier1_quantity,
      tier2_price, tier2_quantity,
      tier3_price, tier3_quantity,
    } = req.body;

    if (!title || !venue || !date)
      return res.status(400).json({ message: 'title, venue and date are required' });
    if (!tier1_quantity || Number(tier1_quantity) === 0)
      return res.status(400).json({ message: 'Standing section (Tier 1) capacity is required' });

    let resolvedSingerId = singer_id || null;
    let eventStatus      = 'pending'; // default — needs admin approval

    if (booking_id) {
      const [bRows] = await db.query(
        'SELECT booking_id, singer_id, status FROM `BOOKING_REQUEST` WHERE booking_id = ? AND organizer_id = ?',
        [booking_id, req.user.u_id]
      );
      if (!bRows.length)
        return res.status(404).json({ message: 'Booking request not found' });
      if (bRows[0].status !== 'accepted')
        return res.status(400).json({ message: 'Singer must accept the booking before you can create the event' });

      resolvedSingerId = bRows[0].singer_id;
      eventStatus      = 'approved'; // singer agreed — skip admin approval
    }

    const [result] = await db.query(
      `INSERT INTO \`EVENT\`
         (organizer_id, singer_id, title, description, poster, date, time,
          venue, city, fee, status,
          tier1_price, tier1_quantity,
          tier2_price, tier2_quantity,
          tier3_price, tier3_quantity)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.u_id, resolvedSingerId,
        title, description || '', poster || '',
        date, time || '18:00:00', venue, city || 'Dhaka', fee || 0,
        eventStatus,
        Number(tier1_price) || 0, Number(tier1_quantity) || 0,
        Number(tier2_price) || 0, Number(tier2_quantity) || 0,
        Number(tier3_price) || 0, Number(tier3_quantity) || 0,
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

// POST /api/events/:id/launch
// Approved events (singer accepted) go directly live
router.post('/:id/launch', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT event_id, status, launch FROM `EVENT` WHERE event_id = ? AND organizer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length)           return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch)         return res.status(400).json({ message: 'Event already launched' });
    if (rows[0].status !== 'approved')
      return res.status(400).json({
        message: rows[0].status === 'pending'
          ? 'Event is awaiting admin approval before launching'
          : 'Event cannot be launched in its current state',
      });

    await db.query("UPDATE `EVENT` SET launch=1, status='live' WHERE event_id=?", [req.params.id]);
    res.json({ message: '🚀 Event is now live on the platform!' });
  } catch (err) {
    console.error('POST /:id/launch:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to launch event' });
  }
});

// PUT /api/events/:id/details — edit before launch
router.put('/:id/details', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT event_id, launch FROM `EVENT` WHERE event_id = ? AND organizer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length)   return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch) return res.status(400).json({ message: 'Cannot edit a launched event' });

    const {
      title, description, poster, date, time, venue, city,
      tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity,
    } = req.body;

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

// PUT /api/events/:id/poster — singer uploads event poster
router.put('/:id/poster', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { poster } = req.body;
    if (!poster) return res.status(400).json({ message: 'poster URL is required' });

    const [rows] = await db.query(
      'SELECT event_id FROM `EVENT` WHERE event_id = ? AND singer_id = ?',
      [req.params.id, req.user.u_id]
    );
    if (!rows.length) return res.status(403).json({ message: 'Event not found or you are not the featured singer' });

    await db.query('UPDATE `EVENT` SET poster=? WHERE event_id=?', [poster, req.params.id]);
    res.json({ message: 'Poster updated' });
  } catch (err) {
    console.error('PUT /:id/poster:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to update poster' });
  }
});

// PUT /api/events/:id/dynamic-pricing
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

// PUT /api/events/:id/ticket-prices
router.put('/:id/ticket-prices', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const { tier1_price, tier1_quantity, tier2_price, tier2_quantity, tier3_price, tier3_quantity } = req.body;
    const [rows] = await db.query('SELECT event_id, launch FROM `EVENT` WHERE event_id=? AND organizer_id=?', [req.params.id, req.user.u_id]);
    if (!rows.length)   return res.status(404).json({ message: 'Event not found' });
    if (rows[0].launch) return res.status(400).json({ message: 'Cannot edit prices of a launched event' });
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

// GET /api/events/:id/ticket-sales
router.get('/:id/ticket-sales', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [evRows] = await db.query(
      'SELECT event_id,title,tier1_price,tier1_quantity,tier2_price,tier2_quantity,tier3_price,tier3_quantity FROM `EVENT` WHERE event_id=? AND organizer_id=?',
      [req.params.id, req.user.u_id]
    );
    if (!evRows.length) return res.status(404).json({ message: 'Event not found' });
    const ev = evRows[0];
    const [salesRows]  = await db.query('SELECT tier,COUNT(*) AS sold,SUM(price) AS revenue FROM `TICKET` WHERE event_id=? GROUP BY tier',[req.params.id]);
    const [recentRows] = await db.query(
      'SELECT t.ticket_id,t.tier,t.price,t.used,t.purchased_at,u.unique_username AS buyer FROM `TICKET` t JOIN `USER` u ON t.buyer_id=u.u_id WHERE t.event_id=? ORDER BY t.purchased_at DESC LIMIT 20',
      [req.params.id]
    );
    const tiers = [{tier:1,price:ev.tier1_price,capacity:ev.tier1_quantity},{tier:2,price:ev.tier2_price,capacity:ev.tier2_quantity},{tier:3,price:ev.tier3_price,capacity:ev.tier3_quantity}]
      .filter(t=>t.capacity>0).map(t=>{const s=salesRows.find(r=>r.tier===t.tier)||{sold:0,revenue:0};return{...t,sold:Number(s.sold),revenue:Number(s.revenue),remaining:Math.max(0,t.capacity-Number(s.sold))};});
    res.json({totalSold:tiers.reduce((s,t)=>s+t.sold,0),totalRevenue:tiers.reduce((s,t)=>s+t.revenue,0),tiers,recentPurchases:recentRows});
  } catch (err) {
    console.error('GET /:id/ticket-sales:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to load ticket sales' });
  }
});

// ─── SINGER ───────────────────────────────────────────────────

// GET /api/events/bookings/mine — MUST be before /:id
router.get('/bookings/mine', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.booking_id, b.organizer_id, b.singer_id,
              COALESCE(b.event_date, b.date) AS event_date,
              b.venue, b.city, COALESCE(b.proposed_fee,0) AS proposed_fee,
              b.message, b.status, b.created_at,
              o.unique_username AS organizer_name, o.email AS organizer_email,
              o.profile_picture AS organizer_pic
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

// PUT /api/events/booking/:id/respond
router.put('/booking/:id/respond', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted','rejected'].includes(status))
      return res.status(400).json({ message: 'status must be accepted or rejected' });
    const [result] = await db.query(
      "UPDATE `BOOKING_REQUEST` SET status=? WHERE booking_id=? AND singer_id=? AND status='pending'",
      [status, req.params.id, req.user.u_id]
    );
    if (result.affectedRows===0) return res.status(404).json({ message: 'Booking not found or already responded to' });
    res.json({ message: status==='accepted' ? '✅ Accepted! The organizer can now create and launch the event.' : '❌ Booking declined.' });
  } catch (err) {
    console.error('PUT /booking/:id/respond:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to respond to booking' });
  }
});

// POST /api/events/booking — organizer sends booking request
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
    res.status(201).json({ message: 'Booking request sent to singer', booking_id: result.insertId });
  } catch (err) {
    console.error('POST /booking:', err.sqlMessage || err.message);
    res.status(500).json({ message: 'Failed to send booking request' });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────

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
