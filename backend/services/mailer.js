const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// optional debug
transporter.verify((err) => {
  if (err) console.log("❌ Email error:", err);
  else console.log("✅ Email server ready");
});

module.exports = transporter;
