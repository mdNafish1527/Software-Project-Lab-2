const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.log('\n📧 ========== EMAIL (DEV MODE - not sent) ==========');
    console.log(`To: ${to} | Subject: ${subject}`);
    console.log('===================================================\n');
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email failed: ${err.message} (continuing without email)`);
  }
};

const sendOTPEmail = async (email, otp) => {
  // Always print OTP to terminal so you can test without email setup
  console.log('\n🔑 ============================================');
  console.log(`   OTP for ${email} => [ ${otp} ]`);
  console.log('==============================================\n');
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Email Verification OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your OTP for email verification:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;background:#111;padding:20px;border-radius:8px;">${otp}</h1>
        <p style="color:#aaa;">Valid for <strong>5 minutes</strong>.</p>
      </div>`,
  });
};

const sendApprovalEmail = async (email, username) => {
  console.log(`\n✅ Account approved: ${username} (${email})\n`);
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Account Approved!',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Hello <strong>${username}</strong>, your account has been <span style="color:#4caf50;">approved</span>!</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">Log In Now</a>
      </div>`,
  });
};

const sendAdminInviteEmail = async (email, token) => {
  const link = `${process.env.FRONTEND_URL}/register/admin?token=${token}`;
  console.log(`\n🔗 Admin invite for ${email}: ${link}\n`);
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Admin Invitation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>You've been invited as <strong>Admin</strong>. Link valid for 24 hours.</p>
        <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a>
        <p style="margin-top:12px;color:#888;font-size:11px;word-break:break-all;">${link}</p>
      </div>`,
  });
};

const sendPasswordResetEmail = async (email, otp) => {
  console.log('\n🔑 ============================================');
  console.log(`   Password Reset OTP for ${email} => [ ${otp} ]`);
  console.log('==============================================\n');
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your password reset OTP:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;background:#111;padding:20px;border-radius:8px;">${otp}</h1>
        <p style="color:#aaa;">Valid for <strong>5 minutes</strong>.</p>
      </div>`,
  });
};

const sendPasswordChangedEmail = async (email) => {
  console.log(`\n🔒 Password changed for: ${email}\n`);
  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Changed',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 GaanBajna</h2>
        <p>Your password was successfully changed. If you did not do this, contact support immediately.</p>
      </div>`,
  });
};

const sendTicketEmail = async (email, tickets, eventTitle) => {
  const ticketList = tickets.map(t => `
    <div style="border:1px solid #f5a623;border-radius:8px;padding:12px;margin:8px 0;background:#111;">
      <p style="margin:4px 0;"><strong>Tier ${t.tier}</strong> — ৳${t.price}</p>
      <p style="margin:4px 0;font-size:11px;color:#f5a623;">QR: ${t.qr_code}</p>
    </div>`).join('');
  console.log(`\n🎟️ ${tickets.length} ticket(s) issued to ${email} for "${eventTitle}"\n`);
  await sendEmail({
    to: email,
    subject: `GaanBajna - Your Tickets for ${eventTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
        <h2 style="color:#f5a623;">🎵 Your Tickets — ${eventTitle}</h2>
        ${ticketList}
        <p style="color:#aaa;margin-top:16px;">Show QR code at the venue. Enjoy! 🎉</p>
      </div>`,
  });
};

const sendComplaintEmail = async (organizerEmail, adminEmail, complaint) => {
  console.log(`\n⚠️ Complaint #${complaint.complaint_id} filed\n`);
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#f5a623;">🎵 GaanBajna - New Complaint #${complaint.complaint_id}</h2>
      <p style="background:#1a1a1a;padding:12px;border-radius:8px;">${complaint.description}</p>
    </div>`;
  await sendEmail({ to: organizerEmail, subject: 'GaanBajna - New Complaint', html });
  await sendEmail({ to: adminEmail, subject: 'GaanBajna - New Complaint (Admin)', html });
};

module.exports = {
  sendOTPEmail, sendApprovalEmail, sendAdminInviteEmail,
  sendPasswordResetEmail, sendPasswordChangedEmail,
  sendTicketEmail, sendComplaintEmail,
};
