const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendComplaintEmail } = require('../utils/email');

// POST /api/complaints
router.post('/', authenticate, async (req, res) => {
  try {
    const { event_id, suspect_u_id, description, evidence } = req.body;

    const [result] = await pool.query(
      'INSERT INTO Complaint (u_id, event_id, suspect_u_id, description, evidence) VALUES (?,?,?,?,?)',
      [req.user.u_id, event_id, suspect_u_id || null, description, evidence || null]
    );

    const [events] = await pool.query(
      'SELECT e.organizer_id, u.email as org_email FROM EVENT e JOIN USER u ON e.organizer_id=u.u_id WHERE e.event_id=?',
      [event_id]
    );
    const [admins] = await pool.query("SELECT email FROM USER WHERE role='admin' LIMIT 1");

    if (events.length > 0 && admins.length > 0) {
      await sendComplaintEmail(
        events[0].org_email,
        admins[0].email,
        { complaint_id: result.insertId, description }
      );
    }

    res.status(201).json({ message: 'Complaint submitted', complaint_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints - admin sees all
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
        u.unique_username as reporter_name,
        e.title as event_title,
        s.unique_username as suspect_name
      FROM Complaint c
      JOIN USER u ON c.u_id = u.u_id
      JOIN EVENT e ON c.event_id = e.event_id
      LEFT JOIN USER s ON c.suspect_u_id = s.u_id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, e.title as event_title FROM Complaint c
       JOIN EVENT e ON c.event_id=e.event_id
       WHERE c.u_id=? ORDER BY c.created_at DESC`,
      [req.user.u_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints/event/:id - organizer sees complaints for their event
router.get('/event/:id', authenticate, requireRole('organizer'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.unique_username as reporter_name FROM Complaint c
       JOIN USER u ON c.u_id=u.u_id
       WHERE c.event_id=? ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;