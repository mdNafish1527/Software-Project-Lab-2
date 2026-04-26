const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const {
  sendOTPEmail,
  sendAdminInviteEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require('../utils/email');

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const isStrongPassword = (pw) =>
  typeof pw === 'string' && pw.length >= 8;

const normalizeEmail = (email) =>
  String(email || '').trim().toLowerCase();

const normalizeUsername = (username) =>
  String(username || '').trim();

const isValidRole = (role) =>
  ['audience', 'singer', 'organizer'].includes(role);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Audience: email verification only
// Singer/Organizer: email verification + admin approval
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const { password, role, profile_picture } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        message: 'username, email, password and role are all required',
      });
    }

    if (!isValidRole(role)) {
      return res.status(400).json({
        message: 'role must be audience, singer, or organizer',
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    if (['singer', 'organizer'].includes(role) && !profile_picture) {
      return res.status(400).json({
        message: 'A profile picture is required for Singer and Organizer accounts',
      });
    }

    const [existing] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ? OR unique_username = ?',
      [email, username]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'Email or username already in use',
      });
    }

    const hashedPw = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO \`USER\`
       (unique_username, email, password, role, status, account_status, profile_picture)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        hashedPw,
        role,
        'email_unverified',
        'email_unverified',
        profile_picture || null,
      ]
    );

    await pool.query(
      'UPDATE `OTP` SET used = TRUE WHERE email = ?',
      [email]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    return res.status(201).json({
      message: 'Registration successful! Check your email for the OTP.',
      role,
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/register:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// Audience becomes approved immediately.
// Singer/Organizer becomes pending for admin dashboard.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'email and otp are required',
      });
    }

    const [rows] = await pool.query(
      `SELECT *
       FROM \`OTP\`
       WHERE email = ?
       AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({
        message: 'No OTP found for this email. Please register again.',
      });
    }

    const record = rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (record.otp_code !== otp.toString()) {
      return res.status(400).json({
        message: 'Incorrect OTP. Please try again.',
      });
    }

    await pool.query(
      'UPDATE `OTP` SET used = TRUE WHERE id = ?',
      [record.id]
    );

    const [users] = await pool.query(
      'SELECT * FROM `USER` WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const user = users[0];

    if (user.role === 'audience') {
      await pool.query(
        `UPDATE \`USER\`
         SET status = 'active',
             account_status = 'approved',
             admin_guidelines = NULL
         WHERE email = ?`,
        [email]
      );

      return res.json({
        message: 'Email verified! You can now log in.',
        status: 'active',
        account_status: 'approved',
        role: user.role,
      });
    }

    if (['singer', 'organizer'].includes(user.role)) {
      await pool.query(
        `UPDATE \`USER\`
         SET status = 'pending',
             account_status = 'pending',
             admin_guidelines = NULL
         WHERE email = ?`,
        [email]
      );

      return res.json({
        message: 'Email verified! Your account is pending admin approval.',
        status: 'pending',
        account_status: 'pending',
        role: user.role,
      });
    }

    return res.status(400).json({
      message: 'Invalid user role',
    });
  } catch (err) {
    console.error('POST /auth/verify-otp:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        message: 'email is required',
      });
    }

    const [users] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({
        message: 'No account found with this email',
      });
    }

    await pool.query(
      'UPDATE `OTP` SET used = TRUE WHERE email = ?',
      [email]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    return res.json({
      message: 'New OTP sent!',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/resend-otp:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Email/username and password are required',
      });
    }

    const [users] = await pool.query(
      'SELECT * FROM `USER` WHERE email = ? OR unique_username = ?',
      [identifier.toLowerCase(), identifier]
    );

    if (!users.length) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const user = users[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    if (
      user.status === 'email_unverified' ||
      user.account_status === 'email_unverified'
    ) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        status: 'email_unverified',
        account_status: 'email_unverified',
      });
    }

    if (
      user.account_status === 'suspended' ||
      user.status === 'suspended'
    ) {
      return res.status(403).json({
        message:
          user.suspended_reason ||
          'Your account has been suspended by admin.',
        status: 'suspended',
        account_status: 'suspended',
      });
    }

    if (
      ['singer', 'organizer'].includes(user.role) &&
      user.account_status === 'pending'
    ) {
      return res.status(403).json({
        message: 'Your account is under review. We will contact you once approved.',
        status: 'pending',
        account_status: 'pending',
      });
    }

    if (
      user.account_status === 'rejected' ||
      user.status === 'rejected'
    ) {
      return res.status(403).json({
        message: 'Your account has been rejected.',
        status: 'rejected',
        account_status: 'rejected',
        guidelines:
          user.admin_guidelines ||
          'Please contact support for more information.',
      });
    }

    const token = jwt.sign(
      {
        u_id: user.u_id,
        user_id: user.u_id,
        role: user.role,
        username: user.unique_username,
        account_status: user.account_status,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    return res.json({
      token,
      user: {
        u_id: user.u_id,
        user_id: user.u_id,
        username: user.unique_username,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        status: user.status,
        account_status: user.account_status,
        admin_guidelines: user.admin_guidelines || null,
      },
    });
  } catch (err) {
    console.error('POST /auth/login:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({
        message: 'email is required',
      });
    }

    const [users] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ?',
      [email]
    );

    if (!users.length) {
      return res.status(404).json({
        message: 'No account found with that email',
      });
    }

    await pool.query(
      'UPDATE `OTP` SET used = TRUE WHERE email = ?',
      [email]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    await sendPasswordResetEmail(email, otp);

    return res.json({
      message: 'Password reset OTP sent to your email.',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/forgot-password:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'email, otp and newPassword are required',
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    const [rows] = await pool.query(
      `SELECT *
       FROM \`OTP\`
       WHERE email = ?
       AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(400).json({
        message: 'No active OTP found',
      });
    }

    const record = rows[0];

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        message: 'OTP has expired',
      });
    }

    if (record.otp_code !== otp.toString()) {
      return res.status(400).json({
        message: 'Incorrect OTP',
      });
    }

    await pool.query(
      'UPDATE `OTP` SET used = TRUE WHERE id = ?',
      [record.id]
    );

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE `USER` SET password = ? WHERE email = ?',
      [hashed, email]
    );

    await sendPasswordChangedEmail(email);

    return res.json({
      message: 'Password reset successfully! You can now log in.',
    });
  } catch (err) {
    console.error('POST /auth/reset-password:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'currentPassword and newPassword are required',
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters',
      });
    }

    const userId = req.user.u_id || req.user.user_id || req.user.id;

    const [users] = await pool.query(
      'SELECT * FROM `USER` WHERE u_id = ?',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const valid = await bcrypt.compare(currentPassword, users[0].password);

    if (!valid) {
      return res.status(400).json({
        message: 'Current password is incorrect',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE `USER` SET password = ? WHERE u_id = ?',
      [hashed, userId]
    );

    await sendPasswordChangedEmail(users[0].email);

    return res.json({
      message: 'Password changed successfully!',
    });
  } catch (err) {
    console.error('POST /auth/change-password:', err.message);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/invite-admin
// Existing admin-only invitation system
// ─────────────────────────────────────────────────────────────────────────────
// router.post('/invite-admin', authenticate, async (req, res) => {
//   try {
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({
//         message: 'Only admins can send invitations',
//       });
//     }

//     const email = normalizeEmail(req.body.email);

//     if (!email) {
//       return res.status(400).json({
//         message: 'email is required',
//       });
//     }

//     const token = uuidv4();
//     const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

//     await pool.query(
//       `INSERT INTO \`ADMIN_INVITATION\`
//        (token, invited_by, email, expires_at)
//        VALUES (?, ?, ?, ?)`,
//       [token, req.user.u_id || req.user.user_id || req.user.id, email, expiresAt]
//     );

//     await sendAdminInviteEmail(email, token);

//     return res.json({
//       message: 'Admin invitation sent!',
//       token,
//     });
//   } catch (err) {
//     console.error('POST /auth/invite-admin:', err.message);
//     return res.status(500).json({
//       message: 'Server error',
//       error: err.message,
//     });
//   }
// });


router.post('/invite-admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can send admin invitations',
      });
    }

    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const [existingUser] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: 'This email already has an account',
      });
    }

    await pool.query(
      'UPDATE `ADMIN_INVITATION` SET used = TRUE WHERE email = ? AND used = FALSE',
      [email]
    );

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO \`ADMIN_INVITATION\`
       (token, invited_by, email, expires_at)
       VALUES (?, ?, ?, ?)`,
      [token, req.user.u_id, email, expiresAt]
    );

    const inviteLink = await sendAdminInviteEmail(email, token);

    res.json({
      message: 'Admin invitation email sent successfully',
      inviteLink,
    });
  } catch (err) {
    console.error('POST /auth/invite-admin:', err.message);
    res.status(500).json({
      message: 'Failed to send admin invitation',
      error: err.message,
    });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register-admin
// ─────────────────────────────────────────────────────────────────────────────

// router.post('/register-admin', async (req, res) => {
//   try {
//     const token = String(req.body.token || '').trim();
//     const username = normalizeUsername(req.body.username);
//     const email = normalizeEmail(req.body.email);
//     const { password } = req.body;

//     if (!token || !username || !email || !password) {
//       return res.status(400).json({
//         message: 'token, username, email and password are required',
//       });
//     }

//     const [invites] = await pool.query(
//       'SELECT * FROM `ADMIN_INVITATION` WHERE token = ? AND used = FALSE',
//       [token]
//     );

//     if (!invites.length) {
//       return res.status(400).json({
//         message: 'Invalid or already used invitation link',
//       });
//     }

//     if (new Date() > new Date(invites[0].expires_at)) {
//       return res.status(400).json({
//         message: 'Invitation link has expired',
//       });
//     }

//     const [existing] = await pool.query(
//       'SELECT u_id FROM `USER` WHERE email = ? OR unique_username = ?',
//       [email, username]
//     );

//     if (existing.length) {
//       return res.status(409).json({
//         message: 'Email or username already in use',
//       });
//     }

//     if (!isStrongPassword(password)) {
//       return res.status(400).json({
//         message: 'Password must be at least 8 characters',
//       });
//     }

//     const hashed = await bcrypt.hash(password, 10);

//     await pool.query(
//       `INSERT INTO \`USER\`
//        (unique_username, email, password, role, status, account_status)
//        VALUES (?, ?, ?, 'admin', 'active', 'approved')`,
//       [username, email, hashed]
//     );

//     await pool.query(
//       'UPDATE `ADMIN_INVITATION` SET used = TRUE WHERE token = ?',
//       [token]
//     );

//     return res.json({
//       message: 'Admin account created! You can now log in.',
//     });
//   } catch (err) {
//     console.error('POST /auth/register-admin:', err.message);
//     return res.status(500).json({
//       message: 'Server error',
//       error: err.message,
//     });
//   }
// });


router.post('/register-admin', async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!token || !username || !email || !password) {
      return res.status(400).json({
        message: 'Token, username, email and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
      });
    }

    const [invites] = await pool.query(
      `SELECT *
       FROM \`ADMIN_INVITATION\`
       WHERE token = ?
       AND email = ?
       AND used = FALSE
       LIMIT 1`,
      [token, email]
    );

    if (!invites.length) {
      return res.status(400).json({
        message: 'Invalid or already used invitation link',
      });
    }

    if (new Date() > new Date(invites[0].expires_at)) {
      return res.status(400).json({
        message: 'Invitation link has expired',
      });
    }

    const [existing] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ? OR unique_username = ?',
      [email, username]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'Email or username already in use',
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO \`USER\`
       (unique_username, email, password, role, status, account_status)
       VALUES (?, ?, ?, 'admin', 'active', 'approved')`,
      [username, email, hashed]
    );

    await pool.query(
      'UPDATE `ADMIN_INVITATION` SET used = TRUE WHERE token = ?',
      [token]
    );

    res.json({
      message: 'Admin account created successfully. You can now log in.',
    });
  } catch (err) {
    console.error('POST /auth/register-admin:', err.message);
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

module.exports = router;
