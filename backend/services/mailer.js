const nodemailer = require("nodemailer");

// ================= VALIDATE ENV =================
if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL credentials missing in environment variables");
}

// ================= TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ================= VERIFY CONNECTION =================
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail Server Error:", error.message);
  } else {
    console.log("📧 Mail Server Ready");
  }
});

// ================= SEND EMAIL =================
const sendEmail = async (to, subject, html) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters");
    }

    const info = await transporter.sendMail({
      from: `"AlertaiQ" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email Sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false;
  }
};

module.exports = sendEmail;
