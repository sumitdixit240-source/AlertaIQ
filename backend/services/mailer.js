const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// verify connection
transporter.verify((err) => {
  if (err) {
    console.log("❌ Email connection failed:", err.message);
  } else {
    console.log("✅ Email server ready");
  }
});

// ✅ OTP function (THIS IS WHAT YOU SHOULD EXPORT)
const sendEmailOTP = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family:Arial">
          <h2>AlertAIQ OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1 style="color:#4f46e5">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `
    });

    console.log("📩 Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.log("❌ Email send failed:", err);
    return false;
  }
};

module.exports = { sendEmailOTP };
