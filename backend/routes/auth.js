const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const {
  sendOTPEmail, sendApprovalEmail, sendAdminInviteEmail,
  sendPasswordResetEmail, sendPasswordChangedEmail,
} = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Validate password strength
const isStrongPassword = (pw) => {
  return pw.length >= 8;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, profile_picture } = req.body;

    if (!username || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });

    if (!['audience', 'singer', 'organizer'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    if (!isStrongPassword(password))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    if (['singer', 'organizer'].includes(role) && !profile_picture)
      return res.status(400).json({ message: 'Profile picture is required for Singer/Organizer' });

    // Check uniqueness
    const [existing] = await pool.query(
      'SELECT u_id FROM USER WHERE email=? OR unique_username=?',
      [email, username]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email or username already exists' });

    const hashedPw = await bcrypt.hash(password, 10);

    // Insert user with pending status
    const [result] = await pool.query(
      'INSERT INTO USER (unique_username, email, password, role, status, profile_picture) VALUES (?,?,?,?,?,?)',
      [username, email, hashedPw, role, 'pending', profile_picture || null]
    );

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await pool.query(
      'INSERT INTO OTP (email, otp_code, expires_at) VALUES (?,?,?)',
      [email, otp, expiresAt]
    );

    // Send OTP (also prints to console for dev)
    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: 'Registration successful! OTP sent to your email. Check the server terminal if email is not configured.',
      u_id: result.insertId,
      role,
      // In development, return OTP directly so frontend can show it
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const [rows] = await pool.query(
      'SELECT * FROM OTP WHERE email=? AND used=FALSE ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'No OTP found for this email. Please register again.' });

    const record = rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    if (record.otp_code !== otp.toString())
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

    // Mark OTP as used
    await pool.query('UPDATE OTP SET used=TRUE WHERE id=?', [record.id]);

    // Get user
    const [users] = await pool.query('SELECT * FROM USER WHERE email=?', [email]);
    if (users.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = users[0];

    if (user.role === 'audience') {
      // Audience → activate immediately
      await pool.query('UPDATE USER SET status=? WHERE email=?', ['active', email]);
      return res.json({
        message: 'Email verified! You can now log in.',
        status: 'active',
        role: user.role,
      });
    } else {
      // Singer/Organizer → stays pending for admin review
      return res.json({
        message: 'Email verified! Your account is pending admin approval. We will contact you soon.',
        status: 'pending',
        role: user.role,
      });
    }
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Check user exists
    const [users] = await pool.query('SELECT u_id FROM USER WHERE email=?', [email]);
    if (users.length === 0)
      return res.status(404).json({ message: 'No account found with this email' });

    // Invalidate old OTPs
    await pool.query('UPDATE OTP SET used=TRUE WHERE email=?', [email]);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query(
      'INSERT INTO OTP (email, otp_code, expires_at) VALUES (?,?,?)',
      [email, otp, expiresAt]
    );

    await sendOTPEmail(email, otp);

    res.json({
      message: 'New OTP sent!',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'Email/username and password are required' });

    const [users] = await pool.query(
      'SELECT * FROM USER WHERE email=? OR unique_username=?',
      [identifier, identifier]
    );

    if (users.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.status === 'pending')
      return res.status(403).json({
        message: 'Your account is under review. We will contact you soon.',
        status: 'pending',
      });

    if (user.status === 'rejected')
      return res.status(403).json({ message: 'Your account has been rejected. Contact support.' });

    const token = jwt.sign(
      { u_id: user.u_id, role: user.role, username: user.unique_username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        u_id: user.u_id,
        username: user.unique_username,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await pool.query('SELECT u_id FROM USER WHERE email=?', [email]);
    if (users.length === 0)
      return res.status(404).json({ message: 'No account found with that email' });

    await pool.query('UPDATE OTP SET used=TRUE WHERE email=?', [email]);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query('INSERT INTO OTP (email, otp_code, expires_at) VALUES (?,?,?)', [email, otp, expiresAt]);
    await sendPasswordResetEmail(email, otp);

    res.json({
      message: 'OTP sent to your email.',
      dev_otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const [rows] = await pool.query(
      'SELECT * FROM OTP WHERE email=? AND used=FALSE ORDER BY created_at DESC LIMIT 1',
      [email]
    );
    if (rows.length === 0) return res.status(400).json({ message: 'No OTP found' });
    const record = rows[0];
    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ message: 'OTP expired' });
    if (record.otp_code !== otp.toString())
      return res.status(400).json({ message: 'Incorrect OTP' });

    await pool.query('UPDATE OTP SET used=TRUE WHERE id=?', [record.id]);
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE USER SET password=? WHERE email=?', [hashed, email]);
    await sendPasswordChangedEmail(email);

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/change-password (authenticated)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!isStrongPassword(newPassword))
      return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const [users] = await pool.query('SELECT * FROM USER WHERE u_id=?', [req.user.u_id]);
    const user = users[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE USER SET password=? WHERE u_id=?', [hashed, req.user.u_id]);
    await sendPasswordChangedEmail(user.email);

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/invite-admin
router.post('/invite-admin', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only admins can send invitations' });

    const { email } = req.body;
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO ADMIN_INVITATION (token, invited_by, email, expires_at) VALUES (?,?,?,?)',
      [token, req.user.u_id, email, expiresAt]
    );
    await sendAdminInviteEmail(email, token);
    res.json({ message: 'Admin invitation sent!', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/register-admin
router.post('/register-admin', async (req, res) => {
  try {
    const { token, username, email, password } = req.body;
    const [invites] = await pool.query(
      'SELECT * FROM ADMIN_INVITATION WHERE token=? AND used=FALSE',
      [token]
    );
    if (invites.length === 0)
      return res.status(400).json({ message: 'Invalid or already used invitation' });

    const invite = invites[0];
    if (new Date() > new Date(invite.expires_at))
      return res.status(400).json({ message: 'Invitation has expired' });

    const [existing] = await pool.query(
      'SELECT u_id FROM USER WHERE email=? OR unique_username=?',
      [email, username]
    );
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email or username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO USER (unique_username, email, password, role, status) VALUES (?,?,?,?,?)',
      [username, email, hashed, 'admin', 'active']
    );
    await pool.query('UPDATE ADMIN_INVITATION SET used=TRUE WHERE token=?', [token]);

    res.json({ message: 'Admin account created! You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
