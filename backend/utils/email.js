const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Email Verification OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your OTP for email verification:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;">${otp}</h1>
        <p style="color:#aaa;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};

const sendApprovalEmail = async (email, username) => {
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Account Approved!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Your account has been <span style="color:#4caf50;">approved</span> by our admin team. You can now log in and start using GaanBajna!</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">Log In Now</a>
      </div>
    `,
  });
};

const sendAdminInviteEmail = async (email, token) => {
  const link = `${process.env.FRONTEND_URL}/register/admin?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Admin Invitation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>You have been invited to join GaanBajna as an <strong>Admin</strong>.</p>
        <p>This link is valid for <strong>24 hours</strong> and can only be used once.</p>
        <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your OTP to reset your password:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;">${otp}</h1>
        <p style="color:#aaa;">Valid for <strong>5 minutes</strong>.</p>
      </div>
    `,
  });
};

const sendPasswordChangedEmail = async (email) => {
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Changed',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your password was successfully changed. If you did not do this, contact support immediately.</p>
      </div>
    `,
  });
};

const sendTicketEmail = async (email, tickets, eventTitle) => {
  const ticketList = tickets.map(t => `
    <div style="border:1px solid #f5a623;border-radius:8px;padding:12px;margin:8px 0;">
      <p><strong>Event:</strong> ${eventTitle}</p>
      <p><strong>Tier:</strong> ${t.tier}</p>
      <p><strong>QR Code:</strong> ${t.qr_code}</p>
    </div>
  `).join('');

  await sendEmail({
    to: email,
    subject: `GaanBajna - Your Tickets for ${eventTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna - Your Tickets</h2>
        ${ticketList}
        <p style="color:#aaa;">Show the QR code at the venue for entry.</p>
      </div>
    `,
  });
};

const sendComplaintEmail = async (organizerEmail, adminEmail, complaint) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#f5a623;">🎵 GaanBajna - New Complaint</h2>
      <p><strong>Complaint ID:</strong> ${complaint.complaint_id}</p>
      <p><strong>Description:</strong> ${complaint.description}</p>
    </div>
  `;
  await sendEmail({ to: organizerEmail, subject: 'GaanBajna - New Complaint Received', html });
  await sendEmail({ to: adminEmail, subject: 'GaanBajna - New Complaint (Admin)', html });
};

module.exports = {
  sendOTPEmail,
  sendApprovalEmail,
  sendAdminInviteEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendTicketEmail,
  sendComplaintEmail,
};