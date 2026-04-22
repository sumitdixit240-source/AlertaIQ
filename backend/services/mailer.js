const nodemailer = require("nodemailer");

// ================= TRANSPORTER =================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be Gmail App Password
  },
});

// ================= VERIFY CONNECTION =================
(async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready");
  } catch (err) {
    console.log("❌ Email verification failed:", err);
  }
})();

// ================= SEND OTP EMAIL =================
const sendEmailOTP = async (email, otp) => {
  try {
    console.log("📨 Sending OTP to:", email);

    const info = await transporter.sendMail({
      from: `"AlertAIQ" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "AlertAIQ OTP Verification Code",
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2>🔐 AlertAIQ OTP Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color:#4f46e5;letter-spacing:5px">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
          <hr/>
          <small>If you didn’t request this, ignore this email.</small>
        </div>
      `,
    });

    console.log("📩 OTP Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.log("❌ EMAIL SEND ERROR FULL:", error);
    return false;
  }
};

module.exports = { sendEmailOTP };
