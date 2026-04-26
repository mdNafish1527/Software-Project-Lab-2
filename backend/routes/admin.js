const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin'));

// Get pending singer/organizer accounts
router.get('/pending-accounts', async (req, res) => {
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
       ORDER BY u_id DESC`
    );

    res.json(rows);
  } catch (err) {
    console.error('Pending accounts error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// Approve singer/organizer
router.put('/users/:userId/approve', async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      `UPDATE \`USER\`
       SET account_status = 'approved',
           status = 'active',
           admin_guidelines = NULL,
           approved_at = NOW()
       WHERE u_id = ?
       AND role IN ('singer', 'organizer')`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'User not found or not approvable',
      });
    }

    res.json({
      message: 'Account approved successfully',
    });
  } catch (err) {
    console.error('Approve account error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// Reject singer/organizer with guidelines
router.put('/users/:userId/reject', async (req, res) => {
  try {
    const { userId } = req.params;
    const { guidelines } = req.body;

    if (!guidelines || !guidelines.trim()) {
      return res.status(400).json({
        message: 'Guidelines are required for rejection',
      });
    }

    const [result] = await db.query(
      `UPDATE \`USER\`
       SET account_status = 'rejected',
           status = 'rejected',
           admin_guidelines = ?,
           rejected_at = NOW()
       WHERE u_id = ?
       AND role IN ('singer', 'organizer')`,
      [guidelines.trim(), userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'User not found or not rejectable',
      });
    }

    res.json({
      message: 'Account rejected with guidelines',
    });
  } catch (err) {
    console.error('Reject account error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// Suspend singer/organizer/audience
// Suspend singer/organizer/audience
router.put('/users/:userId/suspend', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const [result] = await db.query(
      `UPDATE \`USER\`
       SET account_status = 'suspended',
           suspended_reason = ?,
           suspended_at = NOW()
       WHERE u_id = ?
       AND role IN ('singer', 'organizer', 'audience')`,
      [reason || 'Violation of platform rules', userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'User not found or cannot be suspended',
      });
    }

    res.json({
      message: 'Account suspended successfully',
    });
  } catch (err) {
    console.error('Suspend user error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// Unsuspend singer/organizer/audience
// Unsuspend singer/organizer/audience
router.put('/users/:userId/unsuspend', async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await db.query(
      `UPDATE \`USER\`
       SET account_status = 'approved',
           suspended_reason = NULL,
           suspended_at = NULL
       WHERE u_id = ?
       AND role IN ('singer', 'organizer', 'audience')`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'User not found or cannot be unsuspended',
      });
    }

    res.json({
      message: 'Account unsuspended successfully',
    });
  } catch (err) {
    console.error('Unsuspend user error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});
// End event
router.put('/events/:eventId/end', async (req, res) => {
  try {
    const { eventId } = req.params;

    const [result] = await db.query(
      `UPDATE \`EVENT\`
       SET event_status = 'ended',
           status = 'ended',
           ended_at = NOW()
       WHERE event_id = ?`,
      [eventId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    res.json({
      message: 'Event ended successfully',
    });
  } catch (err) {
    console.error('End event error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

module.exports = router;