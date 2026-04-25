const nodemailer = require("nodemailer");

// ================= TRANSPORT =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

// ================= VERIFY =================
transporter.verify()
  .then(() => console.log("✅ Mailer ready"))
  .catch((err) => console.log("❌ Mailer error:", err.message));

// ================= SAFE MAIL SENDER =================
const sendMail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email fields");
    }

    const info = await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📩 Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (err) {
    console.error("❌ Mail send failed:", err.message);

    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = sendMail;