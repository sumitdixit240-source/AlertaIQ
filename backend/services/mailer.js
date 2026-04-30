const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= TRANSPORTER (ROBUST VERSION) =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,              // FIX: better for cloud servers
  secure: false,          // FIX: use STARTTLS

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 10000,
  socketTimeout: 10000,
});

// ================= VERIFY =================
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready");
  }
});

// ================= SEND EMAIL =================
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
