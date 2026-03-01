const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT u_id, unique_username, email, role, status, profile_picture, mobile_banking_number, created_at FROM USER WHERE u_id=?',
      [req.user.u_id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const { username, email, profile_picture, mobile_banking_number } = req.body;
    await pool.query(
      'UPDATE USER SET unique_username=COALESCE(?,unique_username), email=COALESCE(?,email), profile_picture=COALESCE(?,profile_picture), mobile_banking_number=COALESCE(?,mobile_banking_number) WHERE u_id=?',
      [username, email, profile_picture, mobile_banking_number, req.user.u_id]
    );
    const [updated] = await pool.query(
      'SELECT u_id, unique_username, email, role, status, profile_picture, mobile_banking_number FROM USER WHERE u_id=?',
      [req.user.u_id]
    );
    res.json({ message: 'Profile updated', user: updated[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/singers - browse singer profiles
router.get('/singers', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.u_id, u.unique_username, u.profile_picture, u.email,
             sp.bio, sp.fixed_fee, sp.availability, sp.genre
      FROM USER u
      LEFT JOIN SINGER_PROFILE sp ON u.u_id = sp.singer_id
      WHERE u.role='singer' AND u.status='active'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/singers/:id
router.get('/singers/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.u_id, u.unique_username, u.profile_picture,
             sp.bio, sp.fixed_fee, sp.availability, sp.genre
      FROM USER u
      LEFT JOIN SINGER_PROFILE sp ON u.u_id = sp.singer_id
      WHERE u.u_id=? AND u.role='singer'
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Singer not found' });

    const [events] = await pool.query(
      `SELECT event_id, title, date, venue, city, poster, status FROM EVENT WHERE singer_id=? AND status IN ('live','ended')`,
      [req.params.id]
    );
    res.json({ ...rows[0], events });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/singer-profile (singer updates own profile)
router.put('/singer-profile', authenticate, requireRole('singer'), async (req, res) => {
  try {
    const { bio, fixed_fee, availability, genre } = req.body;
    const [exists] = await pool.query('SELECT profile_id FROM SINGER_PROFILE WHERE singer_id=?', [req.user.u_id]);
    if (exists.length === 0) {
      await pool.query(
        'INSERT INTO SINGER_PROFILE (singer_id, bio, fixed_fee, availability, genre) VALUES (?,?,?,?,?)',
        [req.user.u_id, bio, fixed_fee, availability, genre]
      );
    } else {
      await pool.query(
        'UPDATE SINGER_PROFILE SET bio=COALESCE(?,bio), fixed_fee=COALESCE(?,fixed_fee), availability=COALESCE(?,availability), genre=COALESCE(?,genre) WHERE singer_id=?',
        [bio, fixed_fee, availability, genre, req.user.u_id]
      );
    }
    res.json({ message: 'Singer profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/pending - admin: list pending accounts
router.get('/pending', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u_id, unique_username, email, role, profile_picture, created_at
       FROM USER WHERE status='pending' AND role IN ('singer','organizer')`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/approve - admin approves account
router.post('/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM USER WHERE u_id=?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    await pool.query('UPDATE USER SET status=? WHERE u_id=?', ['active', req.params.id]);
    const { sendApprovalEmail } = require('../utils/email');
    await sendApprovalEmail(users[0].email, users[0].unique_username);
    res.json({ message: 'Account approved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/reject - admin rejects account
router.post('/:id/reject', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE USER SET status=? WHERE u_id=?', ['rejected', req.params.id]);
    res.json({ message: 'Account rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/all - admin gets all users
router.get('/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT u_id, unique_username, email, role, status, created_at FROM USER ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;