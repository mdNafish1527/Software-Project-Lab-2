const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');

router.use(authenticate);
router.use(requireRole('admin'));

router.post('/send', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    if (!['singer', 'organizer', 'audience'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const inviteLink = `${process.env.FRONTEND_URL}/register?role=${role}&invite=${token}`;

    await sendMail({
      to: email,
      subject: `Invitation to join GaanBajna as ${role}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>You're invited to join GaanBajna</h2>
          <p>Hello,</p>
          <p>You have been invited by the GaanBajna admin team to join the platform as a <strong>${role}</strong>.</p>
          <p>Please click the button below to create your account:</p>
          <p>
            <a href="${inviteLink}" 
               style="background:#111827;color:white;padding:12px 18px;text-decoration:none;border-radius:6px;display:inline-block;">
              Accept Invitation
            </a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p>${inviteLink}</p>
          <br/>
          <p>Regards,<br/>GaanBajna Team</p>
        </div>
      `,
    });

    res.json({ message: 'Invitation email sent successfully' });
  } catch (err) {
    console.error('Send invitation error:', err);
    res.status(500).json({ message: 'Failed to send invitation email' });
  }
});

module.exports = router;
