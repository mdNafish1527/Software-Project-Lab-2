const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool    = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  sendOTPEmail,
  sendApprovalEmail,
  sendAdminInviteEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require('../utils/email');

const generateOTP = () => Math.floor(100_000 + Math.random() * 900_000).toString();

const isStrongPassword = (pw) => typeof pw === 'string' && pw.length >= 8;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, profile_picture } = req.body;

    if (!username || !email || !password || !role)
      return res.status(400).json({ message: 'username, email, password and role are all required' });

    if (!['audience', 'singer', 'organizer'].includes(role))
      return res.status(400).json({ message: 'role must be audience, singer, or organizer' });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    if (['singer', 'organizer'].includes(role) && !profile_picture)
      return res.status(400).json({ message: 'A profile picture is required for Singer and Organizer accounts' });

    const [existing] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ? OR unique_username = ?',
      [email, username]
    );
    if (existing.length)
      return res.status(409).json({ message: 'Email or username already in use' });

    const hashedPw = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO `USER` (unique_username, email, password, role, status, profile_picture) VALUES (?,?,?,?,?,?)',
      [username, email, hashedPw, role, 'pending', profile_picture || null]
    );

    // Generate OTP (5-minute expiry)
    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?,?,?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful! Check your email for the OTP.',
      u_id:    result.insertId,
      role,
      // Surface OTP in development so the app stays usable without email config
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/register:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'email and otp are required' });

    const [rows] = await pool.query(
      'SELECT * FROM `OTP` WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (!rows.length)
      return res.status(400).json({ message: 'No OTP found for this email. Please register again.' });

    const record = rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    if (record.otp_code !== otp.toString())
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

    await pool.query('UPDATE `OTP` SET used = TRUE WHERE id = ?', [record.id]);

    const [users] = await pool.query('SELECT * FROM `USER` WHERE email = ?', [email]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });

    const user = users[0];

    if (user.role === 'audience') {
      // Audience activates immediately
      await pool.query("UPDATE `USER` SET status = 'active' WHERE email = ?", [email]);
      return res.json({ message: 'Email verified! You can now log in.', status: 'active', role: user.role });
    }

    // Singer / Organizer stays pending for admin approval
    return res.json({
      message: 'Email verified! Your account is pending admin approval.',
      status:  'pending',
      role:    user.role,
    });
  } catch (err) {
    console.error('POST /auth/verify-otp:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const [users] = await pool.query('SELECT u_id FROM `USER` WHERE email = ?', [email]);
    if (!users.length)
      return res.status(404).json({ message: 'No account found with this email' });

    // Invalidate old OTPs
    await pool.query('UPDATE `OTP` SET used = TRUE WHERE email = ?', [email]);

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?,?,?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({
      message: 'New OTP sent!',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/resend-otp:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'Email/username and password are required' });

    const [users] = await pool.query(
      'SELECT * FROM `USER` WHERE email = ? OR unique_username = ?',
      [identifier, identifier]
    );
    if (!users.length)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user  = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status === 'pending')
      return res.status(403).json({
        message: 'Your account is under review. We will contact you once approved.',
        status:  'pending',
      });

    if (user.status === 'rejected')
      return res.status(403).json({ message: 'Your account has been rejected. Please contact support.' });

    const token = jwt.sign(
      { u_id: user.u_id, role: user.role, username: user.unique_username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        u_id:            user.u_id,
        username:        user.unique_username,
        email:           user.email,
        role:            user.role,
        profile_picture: user.profile_picture,
        status:          user.status,
      },
    });
  } catch (err) {
    console.error('POST /auth/login:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const [users] = await pool.query('SELECT u_id FROM `USER` WHERE email = ?', [email]);
    if (!users.length)
      return res.status(404).json({ message: 'No account found with that email' });

    await pool.query('UPDATE `OTP` SET used = TRUE WHERE email = ?', [email]);

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO `OTP` (email, otp_code, expires_at) VALUES (?,?,?)',
      [email, otp, expiresAt]
    );

    await sendPasswordResetEmail(email, otp);

    res.json({
      message: 'Password reset OTP sent to your email.',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('POST /auth/forgot-password:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'email, otp and newPassword are required' });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const [rows] = await pool.query(
      'SELECT * FROM `OTP` WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (!rows.length) return res.status(400).json({ message: 'No active OTP found' });

    const record = rows[0];
    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP has expired' });
    if (record.otp_code !== otp.toString())
      return res.status(400).json({ message: 'Incorrect OTP' });

    await pool.query('UPDATE `OTP` SET used = TRUE WHERE id = ?', [record.id]);

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE `USER` SET password = ? WHERE email = ?', [hashed, email]);
    await sendPasswordChangedEmail(email);

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('POST /auth/reset-password:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password   (authenticated)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const [users] = await pool.query('SELECT * FROM `USER` WHERE u_id = ?', [req.user.u_id]);
    if (!users.length) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE `USER` SET password = ? WHERE u_id = ?', [hashed, req.user.u_id]);
    await sendPasswordChangedEmail(users[0].email);

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('POST /auth/change-password:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/invite-admin   (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/invite-admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can send invitations' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const token     = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO `ADMIN_INVITATION` (token, invited_by, email, expires_at) VALUES (?,?,?,?)',
      [token, req.user.u_id, email, expiresAt]
    );
    await sendAdminInviteEmail(email, token);

    res.json({ message: 'Admin invitation sent!', token });
  } catch (err) {
    console.error('POST /auth/invite-admin:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register-admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register-admin', async (req, res) => {
  try {
    const { token, username, email, password } = req.body;
    if (!token || !username || !email || !password)
      return res.status(400).json({ message: 'token, username, email and password are required' });

    const [invites] = await pool.query(
      'SELECT * FROM `ADMIN_INVITATION` WHERE token = ? AND used = FALSE',
      [token]
    );
    if (!invites.length)
      return res.status(400).json({ message: 'Invalid or already used invitation link' });

    if (new Date() > new Date(invites[0].expires_at))
      return res.status(400).json({ message: 'Invitation link has expired' });

    const [existing] = await pool.query(
      'SELECT u_id FROM `USER` WHERE email = ? OR unique_username = ?',
      [email, username]
    );
    if (existing.length)
      return res.status(409).json({ message: 'Email or username already in use' });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO `USER` (unique_username, email, password, role, status) VALUES (?,?,?,'admin','active')",
      [username, email, hashed]
    );
    await pool.query('UPDATE `ADMIN_INVITATION` SET used = TRUE WHERE token = ?', [token]);

    res.json({ message: 'Admin account created! You can now log in.' });
  } catch (err) {
    console.error('POST /auth/register-admin:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
