const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/users/me
// FIX: joins SINGER_PROFILE for singer-specific fields
// ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.u_id, u.unique_username, u.email, u.role, u.status,
              u.profile_picture, u.mobile_banking_number,
              u.available_dates, u.created_at,
              sp.bio, sp.fixed_fee, sp.genre, sp.availability,
              sp.fixed_fee AS booking_fee
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE u.u_id = ?`,
      [req.user.u_id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];

    // Parse available_dates JSON string → array
    if (user.available_dates && typeof user.available_dates === 'string') {
      try { user.available_dates = JSON.parse(user.available_dates); }
      catch { user.available_dates = []; }
    }
    if (!user.available_dates) user.available_dates = [];

    // availability ENUM → boolean for frontend
    user.available = user.availability !== 'unavailable';

    res.json(user);
  } catch (err) {
    console.error('GET /users/me:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/me
// ─────────────────────────────────────────────────────────────
router.put('/me', authenticate, async (req, res) => {
  try {
    const { username, email, profile_picture, mobile_banking_number } = req.body;
    await db.query(
      `UPDATE \`USER\` SET
         unique_username       = COALESCE(?, unique_username),
         email                 = COALESCE(?, email),
         profile_picture       = COALESCE(?, profile_picture),
         mobile_banking_number = COALESCE(?, mobile_banking_number)
       WHERE u_id = ?`,
      [username || null, email || null, profile_picture || null, mobile_banking_number || null, req.user.u_id]
    );
    const [updated] = await db.query(
      'SELECT u_id, unique_username, email, role, status, profile_picture FROM `USER` WHERE u_id = ?',
      [req.user.u_id]
    );
    res.json({ message: 'Profile updated', user: updated[0] });
  } catch (err) {
    console.error('PUT /users/me:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/singers
// FIX: schema uses status='active' not 'approved'
//      joins SINGER_PROFILE for bio/fee/genre
// ─────────────────────────────────────────────────────────────
router.get('/singers', async (req, res) => {
  try {
    const { search } = req.query;
    let where  = ["u.role = 'singer' AND u.status = 'active'"];
    let params = [];

    if (search) {
      where.push('(u.unique_username LIKE ? OR sp.genre LIKE ? OR sp.bio LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await db.query(
      `SELECT u.u_id, u.unique_username, u.email, u.profile_picture,
              sp.bio, sp.fixed_fee, sp.genre, sp.availability,
              sp.fixed_fee AS booking_fee,
              (sp.availability = 'available' OR sp.availability IS NULL) AS available
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE ${where.join(' AND ')}
       ORDER BY u.unique_username ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /users/singers:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/singers/:id
// ─────────────────────────────────────────────────────────────
router.get('/singers/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.u_id, u.unique_username, u.profile_picture,
              sp.bio, sp.fixed_fee, sp.genre, sp.availability
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE u.u_id = ? AND u.role = 'singer'`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Singer not found' });

    const [events] = await db.query(
      `SELECT event_id, title, date, venue, city, poster, status
       FROM \`EVENT\`
       WHERE singer_id = ? AND status IN ('live','approved','ended')`,
      [req.params.id]
    );
    res.json({ ...rows[0], events });
  } catch (err) {
    console.error('GET /users/singers/:id:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/singer-profile
// FIX: correctly upserts into SINGER_PROFILE table
// ─────────────────────────────────────────────────────────────
router.put('/singer-profile', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { bio, fixed_fee, genre, available, profile_picture } = req.body;
    const availability = available === false ? 'unavailable' : 'available';

    const [existing] = await db.query(
      'SELECT profile_id FROM `SINGER_PROFILE` WHERE singer_id = ?',
      [req.user.u_id]
    );

    if (!existing.length) {
      await db.query(
        'INSERT INTO `SINGER_PROFILE` (singer_id, bio, fixed_fee, genre, availability) VALUES (?, ?, ?, ?, ?)',
        [req.user.u_id, bio || null, Number(fixed_fee) || 0, genre || null, availability]
      );
    } else {
      await db.query(
        `UPDATE \`SINGER_PROFILE\` SET
           bio          = COALESCE(?, bio),
           fixed_fee    = COALESCE(?, fixed_fee),
           genre        = COALESCE(?, genre),
           availability = ?
         WHERE singer_id = ?`,
        [bio || null, fixed_fee != null ? Number(fixed_fee) : null, genre || null, availability, req.user.u_id]
      );
    }

    if (profile_picture) {
      await db.query(
        'UPDATE `USER` SET profile_picture = ? WHERE u_id = ?',
        [profile_picture, req.user.u_id]
      );
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('PUT /users/singer-profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/singer/availability
// FIX: was completely missing
// ─────────────────────────────────────────────────────────────
router.get('/singer/availability', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT available_dates FROM `USER` WHERE u_id = ?',
      [req.user.u_id]
    );
    const raw = rows[0]?.available_dates;
    let dates = [];
    if (raw) {
      try { dates = typeof raw === 'string' ? JSON.parse(raw) : raw; }
      catch { dates = []; }
    }
    res.json(Array.isArray(dates) ? dates : []);
  } catch (err) {
    console.error('GET /users/singer/availability:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/singer/availability
// FIX: was completely missing
// ─────────────────────────────────────────────────────────────
router.put('/singer/availability', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { dates } = req.body;
    if (!Array.isArray(dates))
      return res.status(400).json({ message: 'dates must be an array of YYYY-MM-DD strings' });

    await db.query(
      'UPDATE `USER` SET available_dates = ? WHERE u_id = ?',
      [JSON.stringify(dates), req.user.u_id]
    );
    res.json({ message: 'Availability updated', dates });
  } catch (err) {
    console.error('PUT /users/singer/availability:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/singer/shows
// FIX: was completely missing
// ─────────────────────────────────────────────────────────────
router.get('/singer/shows', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.event_id, e.title, e.poster, e.date, e.time AS event_time,
              e.venue, e.city, e.status,
              e.tier1_price AS proposed_fee,
              o.unique_username AS organizer_name
       FROM \`EVENT\` e
       LEFT JOIN \`USER\` o ON e.organizer_id = o.u_id
       WHERE e.singer_id = ?
       ORDER BY e.date DESC`,
      [req.user.u_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /users/singer/shows:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ─── ADMIN ROUTES ─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────

router.get('/pending', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u_id, unique_username, email, role, profile_picture, created_at
       FROM \`USER\`
       WHERE status = 'pending' AND role IN ('singer','organizer')
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /users/pending:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role, status } = req.query;
    let where  = [];
    let params = [];
    if (role)   { where.push('role = ?');   params.push(role);   }
    if (status) { where.push('status = ?'); params.push(status); }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(
      `SELECT u_id, unique_username, email, role, status, profile_picture, created_at
       FROM \`USER\` ${whereClause} ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /users/all:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// FIX: status='active' matches actual schema ENUM('active','pending','rejected')
router.post('/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.query('SELECT u_id FROM `USER` WHERE u_id = ?', [req.params.id]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });
    await db.query("UPDATE `USER` SET status = 'active' WHERE u_id = ?", [req.params.id]);
    res.json({ message: 'Account approved' });
  } catch (err) {
    console.error('POST /users/:id/approve:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/reject', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.query("UPDATE `USER` SET status = 'rejected' WHERE u_id = ?", [req.params.id]);
    res.json({ message: 'Account rejected' });
  } catch (err) {
    console.error('POST /users/:id/reject:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['active', 'pending', 'rejected'];
    if (!VALID.includes(status))
      return res.status(400).json({ message: `status must be: ${VALID.join(', ')}` });

    const [result] = await db.query(
      'UPDATE `USER` SET status = ? WHERE u_id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    console.error('PUT /users/admin/:id/status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
