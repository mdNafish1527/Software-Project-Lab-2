const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/me
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          u.u_id,
          u.unique_username,
          u.email,
          u.role,
          u.status,
          u.account_status,
          u.admin_guidelines,
          u.suspended_reason,
          u.profile_picture,
          u.mobile_banking_number,
          u.available_dates,
          u.created_at,
          sp.bio,
          sp.fixed_fee,
          sp.genre,
          sp.availability,
          sp.fixed_fee AS booking_fee
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE u.u_id = ?`,
      [req.user.u_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    if (user.available_dates) {
      if (typeof user.available_dates === 'string') {
        try {
          user.available_dates = JSON.parse(user.available_dates);
        } catch {
          user.available_dates = [];
        }
      }
    } else {
      user.available_dates = [];
    }

    user.available = user.availability !== 'unavailable';

    res.json(user);
  } catch (err) {
    console.error('GET /users/me:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/me
// ─────────────────────────────────────────────────────────────────────────────
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
      [
        username || null,
        email || null,
        profile_picture || null,
        mobile_banking_number || null,
        req.user.u_id,
      ]
    );

    const [updated] = await db.query(
      `SELECT 
         u_id,
         unique_username,
         email,
         role,
         status,
         account_status,
         admin_guidelines,
         suspended_reason,
         profile_picture
       FROM \`USER\`
       WHERE u_id = ?`,
      [req.user.u_id]
    );

    res.json({ message: 'Profile updated', user: updated[0] });
  } catch (err) {
    console.error('PUT /users/me:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/singers
// Public — used by organizer booking modal
// Only approved, active, non-suspended singers should appear.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/singers', async (req, res) => {
  try {
    const { search } = req.query;

    const where = [
      "u.role = 'singer'",
      "u.status = 'active'",
      "(u.account_status IS NULL OR u.account_status = 'approved')",
    ];

    const params = [];

    if (search) {
      where.push('(u.unique_username LIKE ? OR sp.genre LIKE ? OR sp.bio LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [rows] = await db.query(
      `SELECT 
          u.u_id,
          u.unique_username,
          u.email,
          u.profile_picture,
          u.status,
          u.account_status,
          sp.bio,
          sp.fixed_fee,
          sp.genre,
          sp.availability,
          sp.fixed_fee AS booking_fee,
          (sp.availability IS NULL OR sp.availability = 'available') AS available
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE ${where.join(' AND ')}
       ORDER BY u.unique_username ASC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /users/singers:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/singers/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/singers/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          u.u_id,
          u.unique_username,
          u.profile_picture,
          u.status,
          u.account_status,
          sp.bio,
          sp.fixed_fee,
          sp.genre,
          sp.availability
       FROM \`USER\` u
       LEFT JOIN \`SINGER_PROFILE\` sp ON sp.singer_id = u.u_id
       WHERE u.u_id = ?
       AND u.role = 'singer'
       AND (u.account_status IS NULL OR u.account_status = 'approved')`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Singer not found' });
    }

    const [events] = await db.query(
      `SELECT event_id, title, date, venue, city, poster, status
       FROM \`EVENT\`
       WHERE singer_id = ?
       AND status IN ('live', 'approved', 'ended')`,
      [req.params.id]
    );

    res.json({ ...rows[0], events });
  } catch (err) {
    console.error('GET /users/singers/:id:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/singer-profile
// ─────────────────────────────────────────────────────────────────────────────
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
        `INSERT INTO \`SINGER_PROFILE\`
         (singer_id, bio, fixed_fee, genre, availability)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.u_id,
          bio || null,
          Number(fixed_fee) || 0,
          genre || null,
          availability,
        ]
      );
    } else {
      await db.query(
        `UPDATE \`SINGER_PROFILE\` SET
           bio          = COALESCE(?, bio),
           fixed_fee    = COALESCE(?, fixed_fee),
           genre        = COALESCE(?, genre),
           availability = ?
         WHERE singer_id = ?`,
        [
          bio || null,
          fixed_fee != null ? Number(fixed_fee) : null,
          genre || null,
          availability,
          req.user.u_id,
        ]
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/singer/availability
// ─────────────────────────────────────────────────────────────────────────────
router.get('/singer/availability', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT available_dates FROM `USER` WHERE u_id = ?',
      [req.user.u_id]
    );

    const raw = rows[0]?.available_dates;
    let dates = [];

    if (raw) {
      if (typeof raw === 'string') {
        try {
          dates = JSON.parse(raw);
        } catch {
          dates = [];
        }
      } else if (Array.isArray(raw)) {
        dates = raw;
      }
    }

    res.json(Array.isArray(dates) ? dates : []);
  } catch (err) {
    console.error('GET /users/singer/availability:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/singer/availability
// ─────────────────────────────────────────────────────────────────────────────
router.put('/singer/availability', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { dates } = req.body;

    if (!Array.isArray(dates)) {
      return res.status(400).json({
        message: 'dates must be an array of YYYY-MM-DD strings',
      });
    }

    await db.query(
      'UPDATE `USER` SET available_dates = ? WHERE u_id = ?',
      [JSON.stringify(dates), req.user.u_id]
    );

    res.json({ message: 'Availability updated', dates });
  } catch (err) {
    console.error('PUT /users/singer/availability:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/singer/shows
// ─────────────────────────────────────────────────────────────────────────────
router.get('/singer/shows', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          e.event_id,
          e.title,
          e.poster,
          e.date,
          e.time AS event_time,
          e.venue,
          e.city,
          e.status,
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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Old fallback route used by AdminDashboard fallback.
// Prefer /api/admin/pending-accounts, but this keeps compatibility.
router.get('/pending', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          u_id,
          u_id AS user_id,
          unique_username,
          email,
          role,
          status,
          account_status,
          admin_guidelines,
          profile_picture,
          created_at
       FROM \`USER\`
       WHERE role IN ('singer', 'organizer')
       AND account_status = 'pending'
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /users/pending:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role, status, account_status } = req.query;
    const where = [];
    const params = [];

    if (role) {
      where.push('role = ?');
      params.push(role);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (account_status) {
      where.push('account_status = ?');
      params.push(account_status);
    }

    const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT 
          u_id,
          u_id AS user_id,
          unique_username,
          email,
          role,
          status,
          account_status,
          admin_guidelines,
          suspended_reason,
          suspended_at,
          approved_at,
          rejected_at,
          profile_picture,
          created_at
       FROM \`USER\`
       ${wc}
       ORDER BY created_at DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /users/all:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Old fallback approve route.
// New preferred route is PUT /api/admin/users/:userId/approve.
router.post('/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT u_id FROM `USER` WHERE u_id = ?',
      [req.params.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.query(
      `UPDATE \`USER\`
       SET status = 'active',
           account_status = 'approved',
           admin_guidelines = NULL,
           approved_at = NOW()
       WHERE u_id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Account approved' });
  } catch (err) {
    console.error('POST /users/:id/approve:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Old fallback reject route.
// New preferred route is PUT /api/admin/users/:userId/reject.
router.post('/:id/reject', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { guidelines } = req.body;

    const [users] = await db.query(
      'SELECT u_id FROM `USER` WHERE u_id = ?',
      [req.params.id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.query(
      `UPDATE \`USER\`
       SET status = 'rejected',
           account_status = 'rejected',
           admin_guidelines = ?,
           rejected_at = NOW()
       WHERE u_id = ?`,
      [guidelines || null, req.params.id]
    );

    res.json({ message: 'Account rejected' });
  } catch (err) {
    console.error('POST /users/:id/reject:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/admin/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['active', 'pending', 'rejected'];

    if (!VALID.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${VALID.join(', ')}`,
      });
    }

    const accountStatus =
      status === 'active'
        ? 'approved'
        : status === 'pending'
        ? 'pending'
        : 'rejected';

    const [result] = await db.query(
      `UPDATE \`USER\`
       SET status = ?,
           account_status = ?
       WHERE u_id = ?`,
      [status, accountStatus, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User status updated to ${status}`,
      account_status: accountStatus,
    });
  } catch (err) {
    console.error('PUT /users/admin/:id/status:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
