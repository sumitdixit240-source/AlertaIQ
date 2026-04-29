const nodemailer = require("nodemailer");

// ================= TRANSPORT =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password (NOT normal password)
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

// ================= VERIFY CONNECTION =================
(async () => {
  try {
    await transporter.verify();
    console.log("✅ Core.AI Mailer Ready");
  } catch (err) {
    console.log("❌ Mailer Error:", err.message);
  }
})();

// ================= CORE MAIL FUNCTION =================
const sendMail = async ({ to, subject, html, text }) => {
  try {
    if (!to || !subject || (!html && !text)) {
      throw new Error("Missing required email parameters");
    }

    const mailOptions = {
      from: `"Core.AI Alerts ⚡" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text, // fallback for plain email clients
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`📩 Mail Sent → ${to} | ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error("❌ Mail Send Failed:", err.message);

    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = sendMail;