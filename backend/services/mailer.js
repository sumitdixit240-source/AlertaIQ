const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Verify connection
transporter.verify()
  .then(() => console.log("✅ Mailer ready"))
  .catch((err) => console.log("❌ Mailer error:", err));

// Generic mail sender (used by auth.js)
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📩 Email sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Mail send failed:", err.message);
    throw err; // important so auth.js can catch and handle it
  }
};

module.exports = sendMail;