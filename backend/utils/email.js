const nodemailer = require('nodemailer');
require('dotenv').config();

const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

const getSender = () => {
  return (
    process.env.EMAIL_FROM ||
    `"GaanBajna" <${process.env.EMAIL_USER || 'bsse1527@iit.du.ac.bd'}>`
  );
};

const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    console.log('Email skipped: missing to, subject, or html');
    return;
  }

  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS ||
    process.env.EMAIL_USER === 'your_gmail@gmail.com'
  ) {
    console.log('\n📧 ========== EMAIL DEV MODE - NOT SENT ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Reason: EMAIL_USER or EMAIL_PASS is not configured.');
    console.log('=================================================\n');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: getSender(),
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}: ${err.message}`);
  }
};

const baseTemplate = ({ title, children }) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;line-height:1.6;">
    <h2 style="color:#f5a623;margin-top:0;">🎵 GaanBajna</h2>
    <h3 style="color:#fff;margin-bottom:18px;">${title}</h3>
    ${children}
    <p style="color:#777;font-size:12px;margin-top:28px;">
      This is an automated email from GaanBajna.
    </p>
  </div>
`;

const sendOTPEmail = async (email, otp) => {
  console.log('\n🔑 ============================================');
  console.log(`   OTP for ${email} => [ ${otp} ]`);
  console.log('==============================================\n');

  await sendEmail({
    to: email,
    subject: 'GaanBajna - Email Verification OTP',
    html: baseTemplate({
      title: 'Email Verification OTP',
      children: `
        <p>Your OTP for email verification is:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;background:#111;padding:20px;border-radius:8px;">
          ${otp}
        </h1>
        <p style="color:#aaa;">This OTP is valid for <strong>5 minutes</strong>.</p>
      `,
    }),
  });
};

const sendApprovalEmail = async (email, username) => {
  console.log(`\n✅ Account approved: ${username} (${email})\n`);

  await sendEmail({
    to: email,
    subject: 'GaanBajna - Account Approved',
    html: baseTemplate({
      title: 'Account Approved',
      children: `
        <p>Hello <strong>${username || 'User'}</strong>,</p>
        <p>Your GaanBajna account has been approved.</p>
        <p>
          <a href="${getFrontendUrl()}/login"
             style="display:inline-block;margin-top:12px;padding:12px 20px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">
            Log In Now
          </a>
        </p>
      `,
    }),
  });
};

const sendAdminInviteEmail = async (email, token) => {
  const link = `${getFrontendUrl()}/register-admin?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  console.log(`\n🔗 Admin invite for ${email}: ${link}\n`);

  await sendEmail({
    to: email,
    subject: 'GaanBajna - Admin Invitation',
    html: baseTemplate({
      title: 'Admin Invitation',
      children: `
        <p>Hello,</p>
        <p>You have been invited to join <strong>GaanBajna</strong> as an admin.</p>
        <p>Please click the button below to create your admin account:</p>
        <p>
          <a href="${link}"
             style="display:inline-block;margin-top:12px;padding:12px 20px;background:#f5a623;color:#000;border-radius:8px;text-decoration:none;font-weight:bold;">
            Create Admin Account
          </a>
        </p>
        <p style="color:#aaa;">This invitation link will expire in <strong>24 hours</strong>.</p>
        <p style="margin-top:12px;color:#888;font-size:11px;word-break:break-all;">
          ${link}
        </p>
      `,
    }),
  });

  return link;
};

const sendPasswordResetEmail = async (email, otp) => {
  console.log('\n🔑 ============================================');
  console.log(`   Password Reset OTP for ${email} => [ ${otp} ]`);
  console.log('==============================================\n');

  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Reset OTP',
    html: baseTemplate({
      title: 'Password Reset OTP',
      children: `
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing:12px;color:#f5a623;text-align:center;background:#111;padding:20px;border-radius:8px;">
          ${otp}
        </h1>
        <p style="color:#aaa;">This OTP is valid for <strong>5 minutes</strong>.</p>
      `,
    }),
  });
};

const sendPasswordChangedEmail = async (email) => {
  console.log(`\n🔒 Password changed for: ${email}\n`);

  await sendEmail({
    to: email,
    subject: 'GaanBajna - Password Changed',
    html: baseTemplate({
      title: 'Password Changed',
      children: `
        <p>Your password was successfully changed.</p>
        <p style="color:#aaa;">If you did not do this, please contact GaanBajna support immediately.</p>
      `,
    }),
  });
};

const sendTicketEmail = async (email, tickets, eventTitle) => {
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  const ticketList = safeTickets
    .map(
      (ticket) => `
        <div style="border:1px solid #f5a623;border-radius:8px;padding:12px;margin:8px 0;background:#111;">
          <p style="margin:4px 0;"><strong>Tier ${ticket.tier}</strong> — ৳${ticket.price}</p>
          <p style="margin:4px 0;font-size:11px;color:#f5a623;">QR: ${ticket.qr_code}</p>
        </div>
      `
    )
    .join('');

  console.log(`\n🎟️ ${safeTickets.length} ticket(s) issued to ${email} for "${eventTitle}"\n`);

  await sendEmail({
    to: email,
    subject: `GaanBajna - Your Tickets for ${eventTitle}`,
    html: baseTemplate({
      title: `Your Tickets — ${eventTitle}`,
      children: `
        ${ticketList}
        <p style="color:#aaa;margin-top:16px;">Show your QR code at the venue. Enjoy the event.</p>
      `,
    }),
  });
};

const sendComplaintEmail = async (organizerEmail, adminEmail, complaint) => {
  console.log(`\n⚠️ Complaint #${complaint?.complaint_id || 'N/A'} filed\n`);

  const complaintText =
    complaint?.description ||
    complaint?.text_content ||
    'A new complaint has been submitted.';

  const html = baseTemplate({
    title: `New Complaint #${complaint?.complaint_id || 'N/A'}`,
    children: `
      <p>A new complaint has been submitted on GaanBajna.</p>
      <div style="background:#1a1a1a;padding:12px;border-radius:8px;color:#ddd;">
        ${complaintText}
      </div>
    `,
  });

  if (organizerEmail) {
    await sendEmail({
      to: organizerEmail,
      subject: 'GaanBajna - New Complaint',
      html,
    });
  }

  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: 'GaanBajna - New Complaint Admin Copy',
      html,
    });
  }
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendApprovalEmail,
  sendAdminInviteEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendTicketEmail,
  sendComplaintEmail,
};
