const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= OPTIMIZED TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  // ⚡ SPEED OPTIMIZATION SETTINGS
  pool: true,              // reuse connection (VERY IMPORTANT)
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 5,            // prevents Gmail throttling

  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// ================= VERIFY (ONLY ON START) =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready (FAST MODE)");
  }
});

// ================= SEND EMAIL (OPTIMIZED FOR OTP SPEED) =================
const sendMail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"AlertAIQ ⚡" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 OTP Email Sent:", info.messageId);

    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false;
  }
};

module.exports = sendMail;
