const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // 🔐 SSL required for Gmail
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS // ⚠️ MUST be Gmail App Password
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 🔍 Strong debug (better than silent verify)
transporter.verify((err, success) => {
  if (err) {
    console.log("❌ Email connection failed:");
    console.log(err);
  } else {
    console.log("✅ Email server ready to send messages");
  }
});

module.exports = transporter;
