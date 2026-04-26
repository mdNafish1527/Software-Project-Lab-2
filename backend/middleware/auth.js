const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.u_id || decoded.user_id || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const [rows] = await db.query(
      `SELECT 
          u_id,
          unique_username,
          email,
          role,
          status,
          account_status,
          admin_guidelines,
          suspended_reason
       FROM \`USER\`
       WHERE u_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User account not found' });
    }

    const user = rows[0];

   if (user.account_status === 'suspended') {
  return res.status(403).json({
    message: user.suspended_reason || 'Your account has been suspended by admin',
    status: 'suspended',
    account_status: 'suspended',
    forceLogout: true,
  });
}

    if (
      ['singer', 'organizer'].includes(user.role) &&
      user.account_status !== 'approved'
    ) {
      return res.status(403).json({
        message: 'Your account is not approved yet',
        status: user.account_status,
        guidelines: user.admin_guidelines || null,
      });
    }

    req.user = {
      ...decoded,
      u_id: user.u_id,
      user_id: user.u_id,
      id: user.u_id,
      unique_username: user.unique_username,
      username: user.unique_username,
      email: user.email,
      role: user.role,
      status: user.status,
      account_status: user.account_status,
      admin_guidelines: user.admin_guidelines,
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    next();
  };
};

module.exports = { authenticate, requireRole };
