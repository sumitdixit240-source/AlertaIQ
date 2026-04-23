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


// ================= VERIFY MAILER =================
transporter.verify()
  .then(() => console.log("✅ Mailer ready"))
  .catch((err) => console.log("❌ Mailer error:", err.message));


// ================= SAFE MAIL SENDER =================
const sendMail = async (to, subject, html) => {
  try {
    // validation (prevents silent bugs)
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

    // return full info (better debugging than true)
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (err) {
    console.error("❌ Mail send failed:", err.message);

    // IMPORTANT: throw so auth.js can catch it
    throw new Error(err.message);
  }
};

module.exports = sendMail;
