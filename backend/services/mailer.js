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

transporter.verify((err) => {
  if (err) {
    console.log("❌ Email error:", err.message);
  } else {
    console.log("✅ Email ready");
  }
});

const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"AlertAIQ" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div>
        <h2>AlertAIQ Verification OTP</h2>
        <h1 style="color:#4f46e5">${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      </div>
    `
  });
};

module.exports = { sendEmailOTP };
